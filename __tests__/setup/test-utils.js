import jwt from "jsonwebtoken";

export const generateTestToken = (userId = 1, expiresIn = "15m") => {
	return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, { expiresIn });
};

export const generateExpiredToken = (userId = 1) => {
	return jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, { expiresIn: "-1h" });
};

export const createMockRequest = (overrides = {}) => {
	return {
		body: {},
		params: {},
		query: {},
		headers: {},
		cookies: {},
		user: null,
		...overrides,
	};
};

export const createMockResponse = () => {
	const res = {
		status: function (code) {
			this.statusCode = code;
			return this;
		},
		json: function (data) {
			this.jsonData = data;
			return this;
		},
		cookie: function (name, value, options) {
			this.cookies = this.cookies || {};
			this.cookies[name] = value;
			return this;
		},
		clearCookie: function (name) {
			this.cookies = this.cookies || {};
			delete this.cookies[name];
			return this;
		},
		setHeader: function (name, value) {
			this.headers = this.headers || {};
			this.headers[name] = value;
			return this;
		},
		statusCode: 200,
		jsonData: null,
		cookies: {},
		headers: {},
	};
	return res;
};

export const createMockNext = () => {
	return {
		called: false,
		error: null,
		fn: function (err = null) {
			this.called = true;
			this.error = err;
		},
	};
};
