"use strict"

/**
 * GIF SPLITTOR
 * @param {*} gif_source source file
 * @param {*} callback 
 */
const GIF_SPLITTOR = async function (gif_source, callback) {
    const gif_img = document.createElement('img');
    gif_img.setAttribute('rel:animated_src', URL.createObjectURL(gif_source));
    gif_img.setAttribute('rel:auto_play', '0')
    gif_img.style.display = 'none';
    document.body.appendChild(gif_img);

    var rub = new SuperGif({ gif: gif_img });
    rub.load(function (res) {
        gif_img.remove();
        var img_list = [];
        for (let i = 1; i < rub.get_length(); i++) {
            rub.move_to(i);
            img_list.push(rub.get_canvas().toDataURL('image/jpeg', 0.8))
        }
        callback(img_list);
    });
}

/**
 * GENERATE VIDEO
 * @param {*} images 
 */
const VIDEO_COMPILER = async function (images, callback) {
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = setTimeout(function () { callback(currTime + timeToCall) },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    var fps = 2;
    var encoder = new Whammy.Video(fps);
    var nextFrame = function () {
        encoder.add(contexts.shift());
        if (contexts.length) {
            requestAnimationFrame(nextFrame);
        } else {
            requestAnimationFrame(done);
        }
    }

    var done = function () {
        let output = encoder.compile();
        var blob = (URL || webkitURL).createObjectURL(output);
        // var video = document.createElement("video");
        // video = document.getElementById('awesome');

        // video.width = canvas.width;
        // video.height = canvas.height;
        // document.body.appendChild(video);
        // video.src = blob;
        callback(blob);
    }

    var idx = 0;
    var contexts = [];
    var len = images.length;
    images.forEach(image => {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = async function () {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(img, 0, 0);
            contexts.push(ctx);
            idx++;
            if (idx + 1 == len) {
                console.log(encoder)
                nextFrame();
            }
        }
        img.src = image;
    });
}

/**
 * GIF SELECTOR
 * STEP:0
 */
Vue.component('foo-gif', {
    template: '#gif-template',
    props: ['step', 'images'],
    data: function () {
        return {
            gif: null,
            state: 0
        }
    },
    methods: {
        onSelect: function (event) {
            let files = event.target.files;
            if (files.length) {
                this.state = 1;
                this.$refs.gif.src = URL.createObjectURL(files[0]);
            }
        },
        onSplitter: function () {
            this.state &&
                GIF_SPLITTOR(this.$refs.file.files[0], (list) => {
                    this.$parent.images = list;
                    this.$parent.step++;
                });
        },
        onReset: function () {
            this.state = 0;
            this.$parent.images = [];
            this.$refs.gif.src = '';
            this.$refs.file.value = '';
        }
    }
});

/**
 * PIC EDITING
 */
Vue.component('foo-pic', {
    template: '#pic-template',
    props: ['step', 'images'],
    methods: {
        onBack: function () {
            this.$parent.step--;
        },
        onCompile: function () {
            VIDEO_COMPILER(this.$parent.images, (res) => {
                this.$parent.step++;
                this.$parent.blob = res;
            });
        }
    }
});

/**
 * VIDEO GENERATE
 */
Vue.component('foo-video', {
    template: '#video-template',
    props: ['step', 'blob'],
    methods: {
        onBack: function () {
            this.$parent.step = 0;
        },
        onDownload: function () {
            window.open(this.$parent.blob, '_blank')

        }
    },
    mounted() {
        setTimeout(this.onDownload, 1000);
    }
});

/**
 * GIF PAGER
 */
const App = new Vue({
    el: '#app',
    components: {},
    data: {
        step: 0,
        images: [],
        blob: null
    },
    mounted() {
        new VConsole();
    }
});
