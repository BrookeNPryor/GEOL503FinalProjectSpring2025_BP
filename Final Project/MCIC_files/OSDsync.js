'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var OSDsync = function () {
  function OSDsync(numViews, myTileSources, OSDoptions, elemPrefix, xShift, syncMethod) {
    var _this = this;

    _classCallCheck(this, OSDsync);

    this.numViews = numViews;
    this.viewers = [];
    if (!syncMethod) syncMethod = 0;
    syncMethod = !syncMethod;
    if (syncMethod) {
      this.lead = -1;
    } else {
      this.lead = 1;
    }
    if (!xShift || isNaN) xShift = 0;
    this.xShift = xShift;
    this.navigatorOnlyFor = OSDoptions.navigatorOnlyFor;
    this.isTouchDevice = false;

    for (var i = 0; i < this.numViews; i++) {
      OSDoptions.id = elemPrefix + i;
      OSDoptions.tileSources = myTileSources[i];
      if (typeof this.navigatorOnlyFor !== 'undefined') {
        if (i != this.navigatorOnlyFor) {
          OSDoptions.showNavigator = false;
        } else {
          OSDoptions.showNavigator = true;
        }
      }
      this.viewers[i] = OpenSeadragon(OSDoptions);
      this.viewers[i].previousPage = 0;
      this.viewers[i].idIndex = i;
    }

    for (var _i = 0; _i < this.numViews; _i++) {
      this.viewers[_i].previousPage = 0;
      if (syncMethod) {
        this.viewers[_i].addHandler('zoom', function (event) {
          return _this.zoomPanHandler(event);
        });
        this.viewers[_i].addHandler('pan', function (event) {
          return _this.zoomPanHandler(event);
        });
        this.viewers[_i].addHandler('page', function (event) {
          return _this.pageHandler(event);
        });
        this.viewers[_i].addHandler('canvas-press', function (event) {
          _this.isTouchDevice = event.pointerType === 'touch';
        });
        this.viewers[_i].addHandler('canvas-double-click', function (event) {
          _this.isTouchDevice = false;
        });
      } else {
        this.viewers[_i].addHandler('animation', function (event) {
          return _this.animationHandler(event);
        });
        this.viewers[_i].addHandler('animation-finish', function (event) {
          return _this.animationHandler(event);
        });
        this.viewers[_i].addHandler('canvas-press', function (event) {
          return _this.leadingHandler(event);
        });
        this.viewers[_i].addHandler('canvas-scroll', function (event) {
          return _this.leadingHandler(event);
        });
        this.viewers[_i].addHandler('canvas-enter', function (event) {
          return _this.leadingHandler(event);
        });
      }
    }
  }

  _createClass(OSDsync, [{
    key: 'leadingHandler',
    value: function leadingHandler(event) {
      var v = event.eventSource.idIndex;
      this.lead = v;
    }
  }, {
    key: 'animationHandler',
    value: function animationHandler(event) {
      var newpos = this.viewers[this.lead].viewport.getCenter(true);
      var newzoom = this.viewers[this.lead].viewport.getZoom(true);
      for (var i = 0; i < this.numViews; i++) {
        if (i != this.lead) {
          this.viewers[i].viewport.zoomTo(newzoom, null, true);
          this.viewers[i].viewport.panTo(newpos, true);
        }
      }
    }
  }, {
    key: 'zoomPanHandler',
    value: function zoomPanHandler(event) {
      var v = event.eventSource.idIndex;

      if (this.lead != -1 && this.lead != v) {
        return;
      }

      this.lead = v;
      var newpos = this.viewers[v].viewport.getCenter();
      if (this.xShift != 0 && (v == 0 || v == 1)) {
        if (v == 1) {
          this.xShift = -this.xShift;
        }
        newpos.x = newpos.x + this.xShift;
      }
      var newzoom = this.viewers[v].viewport.getZoom(this.isTouchDevice);
      for (var i = 0; i < this.numViews; i++) {
        if (i != v) {
          if (v == 1) {}
          this.viewers[i].viewport.zoomTo(newzoom, null, this.isTouchDevice);
          this.viewers[i].viewport.panTo(newpos);
        }
      }

      this.lead = -1;
    }
  }, {
    key: 'pageHandler',
    value: function pageHandler(event) {
      var _this2 = this;

      var v = event.eventSource.idIndex;
      if (this.lead != -1) {
        return;
      }
      this.lead = v;
      setTimeout(function () {
        for (var i = 0; i < _this2.numViews; i++) {
          if (i != v) {
            _this2.viewers[i].goToPage(_this2.viewers[v].currentPage());
          }
        }
        var curViewer = _this2.viewers[v];
        if (!(curViewer.tileSources[event.page].Image.Bond > 0 && curViewer.tileSources[event.page].Image.Bond == curViewer.tileSources[curViewer.previousPage].Image.Bond)) {
          setTimeout(function () {
            var tmpAT = _this2.viewers[v].animationTime;
            for (var _i2 = 0; _i2 < _this2.numViews; _i2++) {
              _this2.viewers[_i2].animationTime = 0;
              _this2.viewers[_i2].viewport.goHome(true);
              _this2.viewers[_i2].animationTime = tmpAT;
            }
          }, 10);
        }
        _this2.viewers[v].previousPage = _this2.viewers[v].currentPage();
        _this2.lead = -1;
      }, 50);
    }
  }]);

  return OSDsync;
}();