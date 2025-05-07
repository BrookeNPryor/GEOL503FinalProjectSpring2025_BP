'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MVgallery = function () {
  function MVgallery(currPid, items, viewers) {
    _classCallCheck(this, MVgallery);

    if (items.length < 2) {
      this.prevIndex = -1;
      this.nextIndex = -1;
      this.currIndex = -1;
      return;
    }

    this.items = items;
    this.viewers = viewers;
    this.updateIndexes(currPid);
  }

  _createClass(MVgallery, [{
    key: 'updateIndexes',
    value: function updateIndexes(currPid) {
      var viewmode = '';
      var prevIndex = -1;
      var blockStart = -1;
      var currIndex = -1;
      var currBlockStart = -1;
      var currBlockEnd = -1;
      var lastIndex = -1;

      if (this.items.length > 0) {
        lastIndex = this.items.length - 1;
        this.items.forEach(function (el, index) {
          if (el.viewmode === undefined || el.viemode === 0) el.viewmode = 1;
          if (el.viewmode != viewmode) {
            if (!(el.viewmode == 1 && viewmode == 3 || el.viewmode == 3 && viewmode == 1)) {
              viewmode = el.viewmode;
              blockStart = index;
              if (currIndex != -1 && currBlockEnd == -1) {
                currBlockEnd = prevIndex;
              }
            }
          }
          if (el.pid == currPid) {
            currIndex = index;
            currBlockStart = blockStart;
          }
          prevIndex = index;
        });
      }
      this.currIndex = currIndex;
      this.currBlockStart = currBlockStart;
      if (currBlockEnd != -1) {
        this.currBlockEnd = currBlockEnd;
      } else {
        this.currBlockEnd = lastIndex;
      }
      if (0 < currIndex) {
        this.prevIndex = currIndex - 1;
      } else {
        this.prevIndex = -1;
      }
      if (currIndex != -1 && lastIndex > currIndex) {
        this.nextIndex = currIndex + 1;
      } else {
        this.nextIndex = -1;
      }
      if (lastIndex >= 0) {
        this.lastIndex = lastIndex;
      }

      var vm = this.items[this.currIndex].viewmode;
      if (vm != 1 && vm != 3) {
        this.currBlockEnd = this.currIndex;
        this.currBlockStart = this.currIndex;
      }
    }
  }, {
    key: 'nextPid',
    value: function nextPid() {
      if (this.nextIndex == -1) return false;
      if (this.nextIndex > this.lastIndex) return false;
      if (this.nextIndex <= this.currIndex) return false;
      if (this.nextIndex > this.currBlockEnd) return false;
      return this.items[this.nextIndex].pid;
    }
  }, {
    key: 'prevPid',
    value: function prevPid() {
      if (this.prevIndex == -1) return false;
      if (this.prevIndex < 0) return false;
      if (this.prevIndex >= this.currIndex) return false;
      if (this.prevIndex < this.currBlockStart) return false;
      return this.items[this.prevIndex].pid;
    }
  }, {
    key: 'gotoNext',
    value: function gotoNext() {
      if (this.nextIndex == -1) return false;
      if (this.nextIndex > this.lastIndex) return false;
      if (this.nextIndex <= this.currIndex) return false;
      if (this.nextIndex > this.currBlockEnd) return false;
      this.prevIndex = this.currIndex;
      this.currIndex = this.nextIndex;
      this.nextIndex = this.nextIndex + 1;
      if (this.nextIndex > this.lastIndex) this.nextIndex = -1;
    }
  }, {
    key: 'gotoPrev',
    value: function gotoPrev() {
      if (this.prevIndex == -1) return false;
      if (this.prevIndex < 0) return false;
      if (this.prevIndex >= this.currIndex) return false;
      if (this.prevIndex < this.currBlockStart) return false;
      this.nextIndex = this.currIndex;
      this.currIndex = this.prevIndex;
      this.prevIndex = this.prevIndex - 1;
      if (this.prevIndex < 0) this.prevIndex = -1;
    }
  }, {
    key: 'loadImageInfo',
    value: function loadImageInfo(pid) {
      var _items = this.items;
      return new Promise(function (resolve) {

        var fi = _items.findIndex(function (x) {
          return x.pid === pid;
        });
        if (fi !== -1 && _items[fi].preloadedImage) {
          if (_items[fi].preloadedImage.infoLoaded == 1) {
            resolve(_items[fi].preloadedImage);
          }
        } else {

          $.get('picshowget.php', { id: pid }, function (data) {
            var $data = $("<div>" + data + "</div>");

            var preloadedImageDefaults = {
              infoLoaded: 0,
              pid: pid,
              viewmode: 0,
              dzi: 0,
              scalebarScale: 0,
              tileSources: [],
              filename: "",
              childViews: [],
              pixelwidth: 0,
              pixelheight: 0,
              frames: 0,
              startframe: 0,
              rotateloop: 0,
              copyrightfloat: "",
              photoinfoinner: "",
              titlebar_h2: ""
            };
            var imgJSON = $data.find('#imgjson').html();
            if (imgJSON) {
              var preloadedImage = $.extend({}, preloadedImageDefaults, JSON.parse(imgJSON));

              if (preloadedImage.childViews === undefined) {
                preloadedImage.childViews = [];
              }
              if ($data.find('#titlebar h2')[0]) {
                preloadedImage.titlebar_h2 = $data.find('#titlebar h2')[0].outerHTML;
              }
              preloadedImage.copyrightfloat = $data.find('#copyrightfloat').html();
              if (preloadedImage.copyrightfloat === undefined) preloadedImage.copyrightfloat = "";
              preloadedImage.photoinfoinner = $data.find('#photoinfoinner').html();
              if (preloadedImage.photoinfoinner === undefined) preloadedImage.photoinfoinner = "";
              preloadedImage.infoLoaded = 1;
              var _fi = _items.findIndex(function (x) {
                return x.pid === pid;
              });
              if (_fi !== -1) {
                _items[_fi].preloadedImage = preloadedImage;
              }
              resolve(preloadedImage);
            }
          });
        }
      });
    }
  }]);

  return MVgallery;
}();