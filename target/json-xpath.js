(function(context) {
	var xpath = {
		SEGMENT_SEPARATOR: '.',
		UNWRAP_ARRAY: true
	};

	/**
	 * parse path to segments
	 * @param  {string} path xpath string
	 * @return {string[]} segments of xpath
	 */
	var parsePathToSegments = function(path) {
		if (path) {
			return path.split(xpath.SEGMENT_SEPARATOR);
		} else {
			return [];
		}
	};

	var operatorMatcher = /([!^$*><]?[=])|([><])|(odd|even|first|last)|(\d+[n]{1}[+]{1}\d+)|(\d+)/;
	var xnPlusY = /\d+/;
	/**
	 * parse segment
	 * @param  {string} segment segment string
	 * @return {{key: string, segment: string}}
	 */
	var parseSegment = function(segment) {
		var brakcetIndex = segment.indexOf('[');
		if (brakcetIndex == -1) {
			return {
				key: segment,
				exp: null
			};
		} else {
			var exp = segment.substring(brakcetIndex + 1, segment.length - 1);
			var matches = exp.match(operatorMatcher);
			if (matches) {
				var matchedStr = matches[0];
				if (matchedStr == exp) {
					return {
						key: segment.substring(0, brakcetIndex),
						exp: '--location',
						loc: matchedStr
					};
				} else {
					var left = exp.substring(0, matches.index);
					var right = exp.substring(matches.index + matchedStr.length);
					return {
						key: segment.substring(0, brakcetIndex),
						exp: matchedStr,
						left: left,
						right: right
					};
				}
			} else {
				return {
					key: segment.substring(0, brakcetIndex),
					exp: '--property',
					prop: exp
				};
			}
		}
	};

	var expression = {
		odd: function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					return object.length > 1 ? object.filter(function(item, index) {
						return index % 2 == 1;
					}) : undefined;
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		},
		even: function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					return object.length > 0 ? object.filter(function(item, index) {
						return index % 2 == 0;
					}) : undefined;
				} else {
					return object;
				}
			} else {
				return object;
			}
		},
		first: function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					return object.length > 0 ? object[0] : undefined;
				} else {
					return object;
				}
			} else {
				return object;
			}
		},
		last: function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					return object.length > 0 ? object[object.length - 1] : undefined;
				} else {
					return object;
				}
			} else {
				return object;
			}
		},
		n: function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					var index = parseInt(segment.loc);
					return object.length > index ? object[index] : undefined;
				} else {
					return segment.loc == '0' ? object : undefined;
				}
			} else {
				return object;
			}
		},
		'xn+y': function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					var matches = segment.loc.match(xnPlusY);
					var multiplier = parseInt(matches[0]);
					var remainder = parseInt(segment.loc.substring(matches[0].length + 2));
					return object.filter(function(item, index) {
						return index % multiplier == remainder;
					});
				} else {
					return segment.loc == '0' ? object : undefined;
				}
			} else {
				return object;
			}
		},
		'op_=': function(parent, segment) {
			var object = parent[segment.key];
			if (object) {
				if (Array.isArray(object)) {
					return object.filter(function(item) {
						return item[segment.left] == segment.right ? item : undefined;
					});
				} else {
					if (object[segment.left] == segment.right) {
						return object;
					} else {
						return undefined;
					}
				}
			} else {
				return undefined;
			}
		},
		'op_!=': function(parent, segment) {},
		'op_$=': function(parent, segment) {},
		'op_^=': function(parent, segment) {},
		'op_*=': function(parent, segment) {},
		'op_>': function(parent, segment) {},
		'op_>=': function(parent, segment) {},
		'op_<': function(parent, segment) {},
		'op_<=': function(parent, segment) {}
	};

	/**
	 * get value by segment which defined as property existed
	 * @param  {{}} parent  parent object
	 * @param  {{key: string, prop: string}} segment segment
	 * @return {*|*[]}
	 */
	var getBySegmentOfProperty = function(parent, segment) {
		var object = parent[segment.key];
		if (object) {
			// object existed
			if (Array.isArray(object)) {
				return object.filter(function(item) {
					return item[segment.prop] !== undefined ? item : undefined;
				});
			} else {
				return object[segment.prop] !== undefined ? object : undefined;
			}
		} else {
			// object not existed
			return undefined;
		}
	};
	var getBySegment = function(json, segment, index) {
		var seg = parseSegment(segment);
		if (seg.exp == null) {
			// no expression
			// translate undefined to null
			return json[seg.key] == null ? null : json[seg.key];
		} else if (seg.exp == '--property') {
			// match property
			return getBySegmentOfProperty(json, seg);
		} else if (seg.exp == '--location') {
			// match location, odd/even/first/last/n/xn+y
			var calculator = expression[seg.loc];
			if (calculator) {
				return calculator(json, seg);
			} else if (seg.loc.indexOf('n') == -1) {
				return expression.n(json, seg);
			} else {
				return expression['xn+y'](json, seg);
			}
		} else {
			// experssion operator
			return expression['op_' + seg.exp](json, seg);
		}
	};
	var unwrapArray = function(array) {
		var ret = [];
		array.forEach(function(item) {
			if (Array.isArray(item)) {
				ret.push.apply(ret, item);
			} else {
				ret.push(item);
			}
		});
		return ret;
	};
	var get = function(json, path) {
		if (!path) {
			return json;
		} else {
			var segments = parsePathToSegments(path);
			var parent = [json];
			var segIndex = 0;
			var segCount = segments.length;
			var getValues = function(item, itemIndex) {
				return getBySegment(item, segments[segIndex], itemIndex);
			};
			for (; segIndex < segCount; segIndex++) {
				var values = parent.map(getValues);
				values = unwrapArray(values);
				if (segIndex != segCount - 1) {
					// not last segment, filter null
					parent = values.filter(function(value) {
						return value != null;
					});
				} else {
					parent = values;
				}
			}
			if (xpath.UNWRAP_ARRAY) {
				switch (parent.length) {
				case 0:
					return undefined;
				case 1:
					return parent[0];
				default:
					return parent;
				}
			} else {
				return parent;
			}
		}
	};

	// exports
	xpath.__parsePathToSegments = parsePathToSegments;
	xpath.__parseSegment = parseSegment;
	xpath.get = get;

	context.JSONXPath = xpath;
}(this));