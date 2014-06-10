function rv(value) {
  if (arguments.callee !== this.constructor) {
    var i, arr = [];
    for (i = 0; i < arguments.length; i++) { arr.push('arguments[' + i + ']'); }
    return eval('new arguments.callee(' + arr.join(',') + ');');
  }

  this._value;
  this._fn;
  this._args;
  this._deps; // = [];
  this._changeHandler;
  this._linkedTo;

  if (arguments.length == 1) {
    this.value = value;
  } else if (arguments.length == 2) {
    this._fn = arguments[0];
    this._args = arguments[1];
    for (var i = 0; i < this._args.length; i++) {
      if (!this._args[i]._deps) { this._args[i]._deps = []; }
      this._args[i]._deps.push(this);
    }
    this._calculateValue();
  }
}

rv.prototype.__defineGetter__('value', function () {
  return this._value;
});

rv.prototype.__defineSetter__('value', function (newValue) {
  var oldValue = this._value;
  if (this._value !== newValue) {
    this._value = newValue;
    this._triggerChange(newValue, oldValue);
    this._propagateChange();
  }
});

rv.prototype._triggerChange = function (newValue, oldValue) {
  if (this._changeHandlers) {
    for (var i = 0; i < this._changeHandlers.length; i++ ) {
      this._changeHandlers[i](newValue, oldValue);
    }
  }
};

rv.prototype._propagateChange = function () {
  if (this._deps) {
    for (var i = 0; i < this._deps.length; i++) {
      this._deps[i]._calculateValue();
      this._deps[i]._propagateChange();
    }
  }
};

rv.prototype._calculateValue = function () {
  if (!this._args || !this._fn) return;
  var newValue = this._fn.apply(null, this._args),
    oldValue = this._value;
  if (newValue !== oldValue) {
    this._value = newValue;
    this._triggerChange(newValue, oldValue);
  }
};

rv.prototype.onchange = function (handlerFn) {
  if (!this._changeHandlers) this._changeHandlers = [];
  this._changeHandlers.push(handlerFn);
};

rv.prototype.cleanup = function () {
  delete this._changeHandlers;
};

rv.prototype.link = function (rvOther) {
  if (!(rvOther instanceof rv)) throw "";
  this._linkedTo = rvOther;
  if (!this._linkedTo._deps) { this._linkedTo._deps = []; }
  this._linkedTo._deps.push(this);
  this._value = this._linkedTo._value;
};

rv.prototype.unlink = function () {
  this._linkedTo._deps.splice(this._linkedTo._deps.indexOf(this), 1);
  delete this._linkedTo;
};

rv.lift = function (fn) {
  var cls = this;
  return function () {
    return cls(fn, Array.prototype.slice.call(arguments));
  };
};

rv.prototype.map = function (mapFn) {
  return rv.lift(mapFn)(this);
};
