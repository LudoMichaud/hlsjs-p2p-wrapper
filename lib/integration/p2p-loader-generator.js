import SegmentView from './mapping/segment-view';
import TrackView from './mapping/track-view';
import {extractInfoFromXhrSetup} from '../utils';

/**
 * Generates a P2PLoader class definition that will use the Streamroot Hls.js wrapper instance passed
 * @static
 * @function
 * @return {class} P2PLoader class definiton
 */
const P2PLoaderGenerator = function (hlsjsWrapper) {

    /**
     * P2PLoader class definition. Implements Hls.js Loader interface.
     * @class
     *
     */
    return class P2PLoader {

        constructor(config) {
            if (config) {
                this.xhrSetup = config.xhrSetup;
            }
            this.reset();
        }

        destroy() {
            this.abort();
        }

        abort() {
            if (this.peerAgentLoader) {
                this.stats.aborted = true;
                this.peerAgentLoader.abort();
            }
            this.reset();
        }

        reset(cancelRetry = true) {
            clearTimeout(this.requestTimeout);
            this.requestTimeout = null;
            // we only want to cancel the retry
            // if this is a full reset. when we reset
            // during a retry routine we want to keep this timeout alive!
            if (cancelRetry) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
            }
            this.peerAgentLoader = null;
        }

        load(url, responseType, onSuccess, onError, onTimeout, timeout, maxRetry, retryDelay, onProgress, frag) {
            if (!onProgress) {
                throw new Error('P2P loader expects progress-callback to be passed for ABR stats (use only as `fLoader` in config)');
            }

            if (!frag) {
                throw new Error('P2P loader can only be used for media fragments (use only as `fLoader` in config)');
            }

            if (!hlsjsWrapper.peerAgentModule) {
                // Should not happen. Means we loaded a frag before the manifest, of there's a problem in the dispose sequence.
                throw new Error('Peer agent is not existing yet');
            }

            if (!isNaN(frag.byteRangeStartOffset) && !isNaN(frag.byteRangeEndOffset)) {
                this.byteRange = frag.byteRangeStartOffset + '-' + frag.byteRangeEndOffset;
            }

            this.frag = frag;
            this.url = url;
            this.responseType = responseType;
            this.onSuccess = onSuccess;
            this.onProgress = onProgress;
            this.onTimeout = onTimeout;
            this.onError = onError;
            this.stats = { trequest: performance.now(), retry: 0 };
            this.timeout = timeout;
            this.maxRetry = maxRetry;
            this.retryDelay = retryDelay;

            this.loadInternal();
        }

        loadSuccess(segmentData, stats) {
            // we might get called while aborted
            // ignore these cases
            if (this.stats.aborted) {
                return;
            }

            let event = {
                currentTarget: {
                    response: segmentData
                }
            };

            if ((stats.p2pDuration + stats.cdnDuration > 0) && stats.p2pDownloaded > 0) {
                let now = performance.now();
                let srTime = stats.p2pDuration + stats.cdnDuration;

                let latency = Math.min(srTime / 2, 10);

                // we set trequest delayed by srTime
                this.stats.trequest = now - srTime;
                this.stats.tfirst = this.stats.trequest + latency;
            }

            this.stats.tload = performance.now();
            this.onSuccess(event, this.stats);
            this.reset();
        }

        // Errors from Peer-agent can only be XHR events
        // because it ultimately fails-through to XHRs always
        loadError (httpError) {
            // we might get called while aborted
            // ignore these cases
            if (this.stats.aborted) {
                return;
            }

            let status = httpError.status;

            if (this.stats.retry < this.maxRetry) {
                console.warn(`${status} while loading ${this.url}, retrying in ${this.retryDelay}...`);
                this.retryTimeout = setTimeout(this.loadInternal.bind(this), this.retryDelay);
                // exponential backoff
                this.retryDelay = Math.min(2 * this.retryDelay, 64000);
                this.stats.retry++;
                this.reset(false);
            } else {
                console.error(`${status} while loading ${this.url}` );
                let xhrEventShim = {
                    target: {
                        status,
                    },
                };
                this.onError(xhrEventShim);
                this.reset();
            }
        }

        loadInternal() {

            if (this.peerAgentLoader) {
                throw new Error('P2P loader was not reset correctly, internal state indicates unfinalized request');
            }

            let {url, xhrSetup} = this;
            let {headers, withCredentials} = extractInfoFromXhrSetup(xhrSetup, url);

            if (this.byteRange) {
                headers.Range = `bytes=${this.frag.byteRangeStartOffset}-${this.frag.byteRangeEndOffset - 1}`;
            }
            let level = hlsjsWrapper.hls.levels[this.frag.level];
            let trackView = new TrackView({level: this.frag.level, urlId: level.urlId});
            let segmentView = new SegmentView({sn: this.frag.sn, trackView, time: this.frag.start});

            let reqInfo = {
                url,
                headers,
                withCredentials
            };

            let callbacks = {
                onSuccess: this.loadSuccess.bind(this),
                onError: this.loadError.bind(this),
                onProgress: this.loadProgress.bind(this)
            };

            this.stats.tfirst = null;
            this.stats.loaded = 0;
            this.requestTimeout = setTimeout(this.loadTimeout.bind(this), this.timeout);
            this.peerAgentLoader = hlsjsWrapper.peerAgentModule.getSegment(reqInfo, callbacks, segmentView);
        }

        loadProgress(event) {

            let loaded = 0;

            if (event.cdnDownloaded) {
                loaded += event.cdnDownloaded;
            }

            if (event.p2pDownloaded) {
                loaded += event.p2pDownloaded;
            }

            this.stats.loaded = loaded;

            // TODO: don't offset timestamp on progress, only on loaded
            // + TODO: loop when latency === playlist duration
            if (this.stats.tfirst === null) {
                this.stats.tfirst = Math.max(performance.now(), this.stats.trequest);
            }

            this.onProgress(event, this.stats);
        }

        loadTimeout() {
            this.onTimeout(null, this.stats);
        }
    };

};

export default P2PLoaderGenerator;
