/**
 * Created by brad.wu on 9/29/2015.
 */

(function() {
	var test = function(message, test, testParams) {
		var result = message;
		if (!test.apply(this, testParams)) {
			console.error(message + '\t[failed]');
		} else {
			console.log(message + '\t[passed]');
		}
	};
	var testParsePathToSegments = function(path, result) {
		var segments = JSONXPath.__parsePathToSegments(path);
		if (segments.length != result.length) {
			return false;
		}
		for (var index = 0, count = segments.length; index < count; index++) {
			if (segments[index] != result[index]) {
				return false;
			}
		}
		return true;
	};
	var testParseSegment = function(segment, result) {
		var parsed = JSONXPath.__parseSegment(segment);
		return !Object.keys(parsed).some(function(key) {
				return parsed[key] != result[key];
			});
	};
	var compare = function(v1, v2) {
		if (Array.isArray(v1)) {
			if (!Array.isArray(v2) || v2.length != v1.length) {
				return false;
			} else {
				for (var index = 0, count = v1.length; index < count; index++) {
					if (!compare(v1[index], v2[index])) {
						return false;
					}
				}
				return true;
			}
		} else if (v1 === null) {
			return v2 === null;
		} else if (v1 === undefined) {
			return v2 === undefined;
		} else if (typeof v1 === 'object') {
			return compareJSON(v1, v2);
		} else {
			return v1 == v2;
		}
	};
	var compareJSON = function(o1, o2) {
		var keys = Object.keys(o1);
		for (var index = 0, count = keys.length; index < count; index++) {
			var prop = o1[keys[index]];
			if (!compare(prop, o2[keys[index]])) {
				return false;
			}
		}
		return true;
	};
	var testGet = function(json, path, expect) {
		return compare(JSONXPath.get(json, path), expect);
	};

	test('Parse single property "abc".', testParsePathToSegments, ['abc', ['abc']]);
	test('Parse hierarchy properties "a.b.c".', testParsePathToSegments, ['a.b.c', ['a', 'b', 'c']]);
	// b which has d, value of d cannot be undefined
	test('Parse hierarchy properties "a.b[d].c".', testParsePathToSegments, ['a.b[d].c', ['a', 'b[d]', 'c']]);
	// b which has d and value is 1
	test('Parse hierarchy properties "a.b[d=1].c".', testParsePathToSegments, ['a.b[d=1].c', ['a', 'b[d=1]', 'c']]);
	// b which has d and value is not 1
	test('Parse hierarchy properties "a.b[d!=1].c".', testParsePathToSegments, ['a.b[d!=1].c', ['a', 'b[d!=1]', 'c']]);
	// b which has d and d starts with 1
	test('Parse hierarchy properties "a.b[d^=1].c".', testParsePathToSegments, ['a.b[d^=1].c', ['a', 'b[d^=1]', 'c']]);
	// b which has d and d ends with 1
	test('Parse hierarchy properties "a.b[d$=1].c".', testParsePathToSegments, ['a.b[d$=1].c', ['a', 'b[d$=1]', 'c']]);
	// b which has d and d contains 1
	test('Parse hierarchy properties "a.b[d*=1].c".', testParsePathToSegments, ['a.b[d*=1].c', ['a', 'b[d*=1]', 'c']]);
	// b which has d and d more than 1
	test('Parse hierarchy properties "a.b[d>1].c".', testParsePathToSegments, ['a.b[d>1].c', ['a', 'b[d>1]', 'c']]);
	// b which has d and d equals or more than 1
	test('Parse hierarchy properties "a.b[d>=1].c".', testParsePathToSegments, ['a.b[d>=1].c', ['a', 'b[d>=1]', 'c']]);
	// b which has d and d less than 1
	test('Parse hierarchy properties "a.b[d<1].c".', testParsePathToSegments, ['a.b[d<1].c', ['a', 'b[d<1]', 'c']]);
	// b which has d and d equals or less than 1
	test('Parse hierarchy properties "a.b[d<=1].c".', testParsePathToSegments, ['a.b[d<=1].c', ['a', 'b[d<=1]', 'c']]);


	// b which has d and index of d is odd
	test('Parse hierarchy properties "a.b[odd].c".', testParsePathToSegments, ['a.b[odd].c', ['a', 'b[odd]', 'c']]);
	// b which has d and index of d is even
	test('Parse hierarchy properties "a.b[even].c".', testParsePathToSegments, ['a.b[even].c', ['a', 'b[even]', 'c']]);
	// b which has d and index of d is first
	test('Parse hierarchy properties "a.b[first].c".', testParsePathToSegments, ['a.b[first].c', ['a', 'b[first]', 'c']]);
	// b which has d and index of d is last
	test('Parse hierarchy properties "a.b[last].c".', testParsePathToSegments, ['a.b[last].c', ['a', 'b[last]', 'c']]);
	// b which has d and index of d is given by parameter n
	test('Parse hierarchy properties "a.b[n].c".', testParsePathToSegments, ['a.b[n].c', ['a', 'b[n]', 'c']]);
	// b which has d and index of d is given by parameter x and y
	test('Parse hierarchy properties "a.b[xn+y].c".', testParsePathToSegments, ['a.b[xn+y].c', ['a', 'b[xn+y]', 'c']]);

	test('Parse no expression property "b"', testParseSegment, ['b', {
		key: 'b',
		exp: null
	}]);
	test('Parse expression property "b[d]"', testParseSegment, ['b[d]', {
		key: 'b',
		exp: '--property',
		prop: 'd'
	}]);
	test('Parse expression property "b[d=1]"', testParseSegment, ['b[d=1]', {
		key: 'b',
		exp: '=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d!=1]"', testParseSegment, ['b[d!=1]', {
		key: 'b',
		exp: '!=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d^=1]"', testParseSegment, ['b[d^=1]', {
		key: 'b',
		exp: '^=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d$=1]"', testParseSegment, ['b[d$=1]', {
		key: 'b',
		exp: '$=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d*=1]"', testParseSegment, ['b[d*=1]', {
		key: 'b',
		exp: '*=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d>1]"', testParseSegment, ['b[d>1]', {
		key: 'b',
		exp: '>',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d>=1]"', testParseSegment, ['b[d>=1]', {
		key: 'b',
		exp: '>=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d<1]"', testParseSegment, ['b[d<1]', {
		key: 'b',
		exp: '<',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[d<=1]"', testParseSegment, ['b[d<=1]', {
		key: 'b',
		exp: '<=',
		left: 'd',
		right: '1'
	}]);
	test('Parse expression property "b[odd]"', testParseSegment, ['b[odd]', {
		key: 'b',
		exp: '--location',
		loc: 'odd'
	}]);
	test('Parse expression property "b[even]"', testParseSegment, ['b[even]', {
		key: 'b',
		exp: '--location',
		loc: 'even'
	}]);
	test('Parse expression property "b[first]"', testParseSegment, ['b[first]', {
		key: 'b',
		exp: '--location',
		loc: 'first'
	}]);
	test('Parse expression property "b[last]"', testParseSegment, ['b[last]', {
		key: 'b',
		exp: '--location',
		loc: 'last'
	}]);
	test('Parse expression property "b[3]"', testParseSegment, ['b[3]', {
		key: 'b',
		exp: '--location',
		loc: '3'
	}]);
	test('Parse expression property "b[3n+1]"', testParseSegment, ['b[3n+1]', {
		key: 'b',
		exp: '--location',
		loc: '3n+1'
	}]);

	test('Get value by property "a"', testGet, [{
		a: 1
	}, 'a', 1]);
	test('Get value by property "a.b"', testGet, [{
		a: {
			b: 1
		}
	}, 'a.b', 1]);
	test('Get value by property "a.b.c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b.c', 1]);
	test('Get value by property "a.b[c].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[c].c', 1]);
	test('Get value by property "a.b[c].c"', testGet, [{
		a: {
			b: {
			}
		}
	}, 'a.b[c].c', undefined]);
	test('Get value by property "a.b[c].c", b is an array with c in (1, 2)', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}]
		}
	}, 'a.b[c].c', [1, 2]]);
	test('Get value by property "a.b[c].c", b is an array with c in (1, undefined)', testGet, [{
		a: {
			b: [{
				c: 1
			}, {}]
		}
	}, 'a.b[c].c', 1]);
	test('Get value by property "a.b[c]", b is an array with c in (1, undefined)', testGet, [{
		a: {
			b: [{
				c: 1
			}, {}]
		}
	}, 'a.b[c]', {
		c: 1
	}]);
	test('Get value by property "a.b[even].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[even].c', 1]);
	test('Get value by property "a.b[even].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}]
		}
	}, 'a.b[even].c', 1]);
	test('Get value by property "a.b[even].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}]
		}
	}, 'a.b[even].c', [1, 3]]);
	test('Get value by property "a.b[odd].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[odd].c', undefined]);
	test('Get value by property "a.b[odd].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}]
		}
	}, 'a.b[odd].c', 2]);
	test('Get value by property "a.b[odd].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}, {
				c: 4
			}]
		}
	}, 'a.b[odd].c', [2, 4]]);
	test('Get value by property "a.b[first].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[first].c', 1]);
	test('Get value by property "a.b[first].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}]
		}
	}, 'a.b[first].c', 1]);
	test('Get value by property "a.b[last].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[last].c', 1]);
	test('Get value by property "a.b[last].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}]
		}
	}, 'a.b[last].c', 2]);
	test('Get value by property "a.b[0].c"', testGet, [{
		a: {
			b: {
				c: 1
			}
		}
	}, 'a.b[0].c', 1]);
	test('Get value by property "a.b[1].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}]
		}
	}, 'a.b[1].c', 2]);
	test('Get value by property "a.b[2n+1].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}]
		}
	}, 'a.b[2n+1].c', 2]);
	test('Get value by property "a.b[2n+1].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}, {
				c: 4
			}]
		}
	}, 'a.b[2n+1].c', [2, 4]]);
	test('Get value by property "a.b[3n+1].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}, {
				c: 4
			}]
		}
	}, 'a.b[3n+1].c', 2]);
	test('Get value by property "a.b[3n+1].c", b is an array', testGet, [{
		a: {
			b: [{
				c: 1
			}, {
				c: 2
			}, {
				c: 3
			}, {
				c: 4
			}, {
				c: 5
			}]
		}
	}, 'a.b[3n+1].c', [2, 5]]);
	test('Get value by property "a.b[c=1].d", b is an array', testGet, [{
		a: {
			b: {
				c: '1',
				d: 1
			}
		}
	}, 'a.b[c=1].d', 1]);
	test('Get value by property "a.b[c=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: '1',
				d: 1
			}, {
				c: '1',
				d: 2
			}]
		}
	}, 'a.b[c=1].d', [1, 2]]);
	test('Get value by property "a.b[c!=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: '2',
				d: 1
			}, {
				c: '1',
				d: 2
			}]
		}
	}, 'a.b[c!=1].d', 1]);
	test('Get value by property "a.b[c^=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: '12',
				d: 1
			}, {
				c: '21',
				d: 2
			}]
		}
	}, 'a.b[c^=1].d', 1]);
	test('Get value by property "a.b[c$=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: '12',
				d: 1
			}, {
				c: '21',
				d: 2
			}]
		}
	}, 'a.b[c$=1].d', 2]);
	test('Get value by property "a.b[c*=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: '312',
				d: 1
			}, {
				c: '22',
				d: 2
			}]
		}
	}, 'a.b[c*=1].d', 1]);
	test('Get value by property "a.b[c>1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: 0.1,
				d: 1
			}, {
				c: 2,
				d: 2
			}, {
				c: 3,
				d: 3
			}]
		}
	}, 'a.b[c>1].d', [2, 3]]);
	test('Get value by property "a.b[c>=1].d", b is an array', testGet, [{
		a: {
			b: [{
				c: 1,
				d: 1
			}, {
				c: 2,
				d: 2
			}, {
				c: 3,
				d: 3
			}]
		}
	}, 'a.b[c>=1].d', [1, 2, 3]]);
	test('Get value by property "a.b[c<3].d", b is an array', testGet, [{
		a: {
			b: [{
				c: 1,
				d: 1
			}, {
				c: 2,
				d: 2
			}, {
				c: 3,
				d: 3
			}]
		}
	}, 'a.b[c<3].d', [1, 2]]);
	test('Get value by property "a.b[c<=3].d", b is an array', testGet, [{
		a: {
			b: [{
				c: 1,
				d: 1
			}, {
				c: 2,
				d: 2
			}, {
				c: 3,
				d: 3
			}]
		}
	}, 'a.b[c<=3].d', [1, 2, 3]]);
}());