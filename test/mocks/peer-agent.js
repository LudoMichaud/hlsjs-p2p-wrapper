/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "segmentView", "varsIgnorePattern": "headers" }]*/

class PeerAgentMock {

    getSegment(reqInfo, callbacks, segmentView) {

        const {url, headers, withCredentials} = reqInfo;
        const {onSuccess, onError, onProgress} = callbacks;

        try {

            let xhr = new XMLHttpRequest();

            xhr.onreadystatechange = (e) => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 206) {
                        let stats = {
                            cdnDownloaded: xhr.response.byteLength
                        };
                        onSuccess(xhr.response, stats);
                    } else {
                        onError(e);
                    }
                }
            };
            xhr.onprogress = (e) => {

                e.cdnDownloaded = e.loaded;
                onProgress(e);
            };
            xhr.withCredentials = withCredentials;
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            if (this.xhrSetup) {
                this.xhrSetup(xhr, url);
            }
            xhr.send();

        } catch (e) {
            console.log(e);
        }
    }

}

export default PeerAgentMock;
