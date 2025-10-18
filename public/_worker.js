var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
var handleParsingAllValues = (form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form2, key, value) => {
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match[1], new RegExp(`^${match[2]}(?=/${next})`)] : [label, match[1], new RegExp(`^${match[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf(
    "/",
    url.charCodeAt(9) === 58 ? 13 : 8
  );
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var escapeRe = /[&<>'"]/;
var stringBufferToString = async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
};
var escapeToBuffer = (str, buffer) => {
  const match = str.search(escapeRe);
  if (match === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
};
var resolveCallbackSync = (str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html2, arg, headers) => {
    const res = (html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  };
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input2, requestInit, Env, executionCtx) => {
    if (input2 instanceof Request) {
      return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
    }
    input2 = input2.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/constants.js
var DOM_RENDERER = Symbol("RENDERER");
var DOM_ERROR_HANDLER = Symbol("ERROR_HANDLER");
var DOM_STASH = Symbol("STASH");
var DOM_INTERNAL_TAG = Symbol("INTERNAL");
var DOM_MEMO = Symbol("MEMO");
var PERMALINK = Symbol("PERMALINK");

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/dom/utils.js
var setInternalTagFlag = (fn) => {
  ;
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = (values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var createContext = (defaultValue) => {
  const values = [defaultValue];
  const context = (props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } finally {
      values.pop();
    }
    if (string instanceof Promise) {
      return string.then((resString) => raw(resString, resString.callbacks));
    } else {
      return raw(string);
    }
  };
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
};
var useContext = (context) => {
  return context.values.at(-1);
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/intrinsic-element/common.js
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/intrinsic-element/components.js
var components_exports = {};
__export(components_exports, {
  button: () => button,
  form: () => form,
  input: () => input,
  link: () => link,
  meta: () => meta,
  script: () => script,
  style: () => style,
  title: () => title
});

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/children.js
var toArray = (children) => Array.isArray(children) ? children : [children];

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/intrinsic-element/components.js
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = (tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] ||= [];
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  if (deDupeKeys.length > 0) {
    LOOP:
      for (const [, tagProps] of tags) {
        for (const key of deDupeKeys) {
          if ((tagProps?.[key] ?? null) === props?.[key]) {
            duped = true;
            break LOOP;
          }
        }
      }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeKeys.length > 0) {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (precedence === void 0) {
      insertTags = tags.map(([tag2]) => tag2);
    } else {
      const precedences = [];
      insertTags = tags.map(([tag2, , precedence2]) => {
        let order = precedences.indexOf(precedence2);
        if (order === -1) {
          precedences.push(precedence2);
          order = precedences.length - 1;
        }
        return [tag2, order];
      }).sort((a, b) => a[1] - b[1]).map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
};
var returnWithoutSpecialBehavior = (tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString());
var documentMetadataTag = (tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
};
var title = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag("title", children, props, false);
};
var script = ({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag("script", children, props, false);
};
var style = ({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", children, props, true);
};
var link = ({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag("link", children, props, "precedence" in props);
};
var meta = ({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag("meta", children, props, false);
};
var newJSXNode = (tag, { children, ...props }) => new JSXNode(tag, props, toArray(children ?? []));
var form = (props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
};
var formActionableElement = (tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
};
var input = (props) => formActionableElement("input", props);
var button = (props) => formActionableElement("button", props);

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/utils.js
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = (key) => normalizeElementKeyMap.get(key) || key;
var styleObjectForEach = (style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(
      key,
      v == null ? null : typeof v === "number" ? !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}` : v
    );
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/base.js
var nameSpaceContext = void 0;
var getNameSpaceContext = () => nameSpaceContext;
var toSVGAttributeName = (key) => /[A-Z]/.test(key) && key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key;
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = (children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
};
var JSXNode = class {
  tag;
  props;
  key;
  children;
  isEscaped = true;
  localContexts;
  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const buffer = [""];
    this.localContexts?.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      this.localContexts?.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = nameSpaceContext && useContext(nameSpaceContext) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (key === "children") {
      } else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    const { children } = this;
    const res = this.tag.call(null, {
      ...this.props,
      children: children.length <= 1 ? children[0] : children
    });
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const currentContexts = globalContexts.map((c) => [c, c.values.at(-1)]);
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.localContexts = currentContexts;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks ||= [];
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var initDomRenderer = false;
var jsxFn = (tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      ;
      components_exports[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (components_exports[tag]) {
    return new JSXFunctionNode(
      components_exports[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext ||= createContext("");
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}

// src/render.tsx
var Render = ({ isAuthenticated, showWarning }) => {
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsxDEV("html", { children: [
      /* @__PURE__ */ jsxDEV("head", { children: [
        /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
        /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
        /* @__PURE__ */ jsxDEV("title", { children: "\u767B\u5F55" }),
        /* @__PURE__ */ jsxDEV("script", { src: "https://cdn.tailwindcss.com" })
      ] }),
      /* @__PURE__ */ jsxDEV("body", { class: "bg-gray-100 flex items-center justify-center h-screen", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-full max-w-xs", children: /* @__PURE__ */ jsxDEV("form", { id: "login-form", class: "bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "mb-4", children: [
            /* @__PURE__ */ jsxDEV("label", { class: "block text-gray-700 text-sm font-bold mb-2", for: "auth-key", children: "ACCESS_KEY" }),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                class: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
                id: "auth-key",
                type: "password",
                placeholder: "******************"
              }
            )
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "flex items-center justify-between", children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              class: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline",
              type: "submit",
              children: "\u767B\u5F55"
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsxDEV(
          "script",
          {
            dangerouslySetInnerHTML: {
              __html: `
                                document.getElementById('login-form').addEventListener('submit', async function(e) {
                                    e.preventDefault();
                                    const key = document.getElementById('auth-key').value;
                                    const response = await fetch(window.location.href, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ key }),
                                    });
                                    if (response.ok) {
                                        window.location.reload();
                                    } else {
                                        alert('\u767B\u5F55\u5931\u8D25');
                                    }
                                });
                            `
            }
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxDEV("html", { children: [
    /* @__PURE__ */ jsxDEV("head", { children: [
      /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsxDEV("title", { children: "Gemini API \u5BC6\u94A5\u7BA1\u7406" }),
      /* @__PURE__ */ jsxDEV("script", { src: "https://cdn.tailwindcss.com" })
    ] }),
    /* @__PURE__ */ jsxDEV("body", { class: "bg-slate-100 text-slate-800", children: [
      showWarning && /* @__PURE__ */ jsxDEV("div", { class: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4", role: "alert", children: [
        /* @__PURE__ */ jsxDEV("strong", { class: "font-bold", children: "\u5B89\u5168\u8B66\u544A\uFF1A" }),
        /* @__PURE__ */ jsxDEV("span", { class: "block", children: "\u5F53\u524D HOME_ACCESS_KEY \u6216 AUTH_KEY \u4E3A\u9ED8\u8BA4\u503C\uFF0C\u8BF7\u5C3D\u5FEB\u4FEE\u6539\u73AF\u5883\u53D8\u91CF\u5E76\u91CD\u65B0\u90E8\u7F72 Worker\uFF01" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "flex h-screen", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "w-64 bg-slate-800 text-white p-4 flex flex-col", children: [
          /* @__PURE__ */ jsxDEV("h1", { class: "text-2xl font-bold mb-8 text-sky-400", children: "\u7BA1\u7406\u9762\u677F" }),
          /* @__PURE__ */ jsxDEV("nav", { class: "flex flex-col space-y-2", children: [
            /* @__PURE__ */ jsxDEV("a", { href: "#", id: "nav-keys-list", class: "block py-2.5 px-4 rounded-lg bg-slate-700 transition-colors", children: "\u5BC6\u94A5\u5217\u8868" }),
            /* @__PURE__ */ jsxDEV("a", { href: "#", id: "nav-add-keys", class: "block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition-colors", children: "\u6DFB\u52A0\u5BC6\u94A5" })
          ] })
        ] }),
        /* @__PURE__ */ jsxDEV("div", { class: "flex-1 p-8 overflow-y-auto", children: [
          /* @__PURE__ */ jsxDEV("div", { id: "page-keys-list", children: [
            /* @__PURE__ */ jsxDEV("h2", { class: "text-3xl font-bold mb-6 text-slate-700", children: "\u5BC6\u94A5\u5217\u8868" }),
            /* @__PURE__ */ jsxDEV("div", { class: "bg-white p-6 rounded-lg shadow-sm", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "flex justify-between items-center mb-4", children: [
                /* @__PURE__ */ jsxDEV("h3", { class: "text-xl font-semibold text-slate-600", children: "\u5DF2\u5B58\u50A8\u7684\u5BC6\u94A5" }),
                /* @__PURE__ */ jsxDEV("div", { class: "space-x-2", children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      id: "check-keys-btn",
                      class: "px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors shadow-sm",
                      children: "\u4E00\u952E\u68C0\u67E5"
                    }
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      id: "refresh-keys-btn",
                      class: "px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors shadow-sm",
                      children: "\u5237\u65B0"
                    }
                  ),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      id: "select-invalid-keys-btn",
                      class: "px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm ml-2 hidden",
                      children: "\u52FE\u9009\u65E0\u6548\u5BC6\u94A5"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "max-h-96 overflow-y-auto border rounded-lg", children: /* @__PURE__ */ jsxDEV("table", { id: "keys-table", class: "w-full text-left", children: [
                /* @__PURE__ */ jsxDEV("thead", { class: "bg-slate-50", children: /* @__PURE__ */ jsxDEV("tr", { class: "border-b border-slate-200", children: [
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 w-6", children: /* @__PURE__ */ jsxDEV("input", { type: "checkbox", id: "select-all-keys", class: "rounded border-slate-300" }) }),
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 text-slate-600 font-semibold", children: "API \u5BC6\u94A5" }),
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 text-slate-600 font-semibold", children: "\u72B6\u6001" }),
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 text-slate-600 font-semibold", children: "\u5206\u7EC4" }),
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 text-slate-600 font-semibold", children: "\u6700\u540E\u68C0\u67E5\u65F6\u95F4" }),
                  /* @__PURE__ */ jsxDEV("th", { class: "p-3 text-slate-600 font-semibold", children: "\u5931\u8D25\u6B21\u6570" })
                ] }) }),
                /* @__PURE__ */ jsxDEV("tbody", { class: "divide-y divide-slate-200" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("div", { id: "pagination-controls", class: "mt-4 flex justify-center items-center", children: [
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    id: "prev-page-btn",
                    class: "px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 shadow-sm",
                    disabled: true,
                    children: "\u4E0A\u4E00\u9875"
                  }
                ),
                /* @__PURE__ */ jsxDEV("span", { id: "page-info", class: "mx-4 text-slate-600" }),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    id: "next-page-btn",
                    class: "px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 shadow-sm",
                    disabled: true,
                    children: "\u4E0B\u4E00\u9875"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  id: "delete-selected-keys-btn",
                  class: "mt-4 w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors hidden shadow-sm",
                  children: "\u5220\u9664\u9009\u4E2D"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { id: "page-add-keys", class: "hidden", children: [
            /* @__PURE__ */ jsxDEV("h2", { class: "text-3xl font-bold mb-6 text-slate-700", children: "\u6DFB\u52A0\u5BC6\u94A5" }),
            /* @__PURE__ */ jsxDEV("div", { class: "bg-white p-6 rounded-lg shadow-sm", children: [
              /* @__PURE__ */ jsxDEV("h3", { class: "text-xl font-semibold mb-4 text-slate-600", children: "\u6279\u91CF\u6DFB\u52A0\u5BC6\u94A5" }),
              /* @__PURE__ */ jsxDEV("form", { id: "add-keys-form", children: [
                /* @__PURE__ */ jsxDEV(
                  "textarea",
                  {
                    id: "api-keys",
                    class: "w-full h-48 p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition",
                    placeholder: "\u8BF7\u8F93\u5165API\u5BC6\u94A5\uFF0C\u6BCF\u884C\u4E00\u4E2A"
                  }
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "submit",
                    class: "mt-4 w-full px-4 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm",
                    children: "\u6DFB\u52A0\u5BC6\u94A5"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxDEV(
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `
								document.addEventListener('DOMContentLoaded', () => {
										const addKeysForm = document.getElementById('add-keys-form');
										const apiKeysTextarea = document.getElementById('api-keys');
										const refreshKeysBtn = document.getElementById('refresh-keys-btn');
										const keysTableBody = document.querySelector('#keys-table tbody');
										const selectAllCheckbox = document.getElementById('select-all-keys');
										const deleteSelectedBtn = document.getElementById('delete-selected-keys-btn');
										const checkKeysBtn = document.getElementById('check-keys-btn');
										const paginationControls = document.getElementById('pagination-controls');
										const prevPageBtn = document.getElementById('prev-page-btn');
										const nextPageBtn = document.getElementById('next-page-btn');
										const pageInfoSpan = document.getElementById('page-info');
										const selectInvalidKeysBtn = document.getElementById('select-invalid-keys-btn');

										const navKeysList = document.getElementById('nav-keys-list');
										const navAddKeys = document.getElementById('nav-add-keys');
										const pageKeysList = document.getElementById('page-keys-list');
										const pageAddKeys = document.getElementById('page-add-keys');

										let currentPage = 1;
										const pageSize = 50;
										let totalPages = 1;

										const showPage = (pageId) => {
											[pageKeysList, pageAddKeys].forEach(page => {
												if (page.id === pageId) {
													page.classList.remove('hidden');
												} else {
													page.classList.add('hidden');
												}
											});
											[navKeysList, navAddKeys].forEach(nav => {
												if (nav.id === \`nav-\${pageId.split('-')[1]}-\${pageId.split('-')[2]}\`) {
													nav.classList.add('bg-gray-700');
													nav.classList.remove('hover:bg-gray-700');
												} else {
													nav.classList.remove('bg-gray-700');
													nav.classList.add('hover:bg-gray-700');
												}
											});
										};

										navKeysList.addEventListener('click', (e) => {
											e.preventDefault();
											showPage('page-keys-list');
										});

										navAddKeys.addEventListener('click', (e) => {
											e.preventDefault();
											showPage('page-add-keys');
										});

										const updatePaginationControls = () => {
												pageInfoSpan.textContent = \`\u7B2C \${currentPage} / \${totalPages} \u9875\`;
												prevPageBtn.disabled = currentPage === 1;
												nextPageBtn.disabled = currentPage >= totalPages;
										};

										const fetchAndRenderKeys = async () => {
												keysTableBody.innerHTML = '<tr><td colspan="7" class="p-2 text-center">\u52A0\u8F7D\u4E2D...</td></tr>';
												try {
												  const response = await fetch(\`/api/keys?page=\${currentPage}&pageSize=\${pageSize}\`);
												  const { keys, total } = await response.json();
												  
												  totalPages = Math.ceil(total / pageSize);
												  keysTableBody.innerHTML = '';
												  if (keys.length === 0) {
												    keysTableBody.innerHTML = '<tr><td colspan="7" class="p-2 text-center">\u6682\u65E0\u5BC6\u94A5</td></tr>';
												  } else {
												    keys.forEach(key => {
												      const statusMap = { normal: '\u6B63\u5E38', abnormal: '\u5F02\u5E38' };
												      const row = document.createElement('tr');
												      row.className = 'hover:bg-slate-50 transition-colors';
												      row.dataset.key = key.api_key;
												      row.innerHTML = \`
												        <td class="p-3 w-6"><input type="checkbox" class="key-checkbox rounded border-slate-300" data-key="\${key.api_key}" /></td>
												        <td class="p-3 font-mono text-sm text-slate-700">\${key.api_key}</td>
												        <td class="p-3 status-cell">\${statusMap[key.status] || key.status}</td>
												        <td class="p-3">\${statusMap[key.key_group] || key.key_group}</td>
												        <td class="p-3 text-sm text-slate-500">\${key.last_checked_at ? new Date(key.last_checked_at).toLocaleString() : 'N/A'}</td>
												        <td class="p-3 text-center">\${key.failed_count}</td>
												      \`;
												      keysTableBody.appendChild(row);
												    });
												  }
												  updatePaginationControls();
												} catch (error) {
												  keysTableBody.innerHTML = '<tr><td colspan="7" class="p-2 text-center text-red-500">\u52A0\u8F7D\u5931\u8D25</td></tr>';
												  console.error('Failed to fetch keys:', error);
												}
										};

										const updateDeleteButtonVisibility = () => {
												const selectedKeys = document.querySelectorAll('.key-checkbox:checked');
												deleteSelectedBtn.classList.toggle('hidden', selectedKeys.length === 0);
										};

										keysTableBody.addEventListener('change', (e) => {
												if (e.target.classList.contains('key-checkbox')) {
												  updateDeleteButtonVisibility();
												}
										});

										selectAllCheckbox.addEventListener('change', () => {
												const checkboxes = document.querySelectorAll('.key-checkbox');
												checkboxes.forEach(checkbox => {
												  checkbox.checked = selectAllCheckbox.checked;
												});
												updateDeleteButtonVisibility();
										});

										deleteSelectedBtn.addEventListener('click', async () => {
												const selectedKeys = Array.from(document.querySelectorAll('.key-checkbox:checked')).map(cb => cb.dataset.key);
												if (selectedKeys.length === 0) {
												  alert('\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u5BC6\u94A5\u3002');
												  return;
												}

												if (!confirm(\`\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 \${selectedKeys.length} \u4E2A\u5BC6\u94A5\u5417\uFF1F\`)) {
												  return;
												}

												try {
												  const response = await fetch('/api/keys', {
												    method: 'DELETE',
												    headers: { 'Content-Type': 'application/json' },
												    body: JSON.stringify({ keys: selectedKeys }),
												  });
												  const result = await response.json();
												  if (response.ok) {
												    alert(result.message || '\u5BC6\u94A5\u5220\u9664\u6210\u529F\u3002');
												    fetchAndRenderKeys();
												    updateDeleteButtonVisibility();
												    selectAllCheckbox.checked = false;
												  } else {
												    alert(\`\u5220\u9664\u5BC6\u94A5\u5931\u8D25: \${result.error || '\u672A\u77E5\u9519\u8BEF'}\`);
												  }
												} catch (error) {
												  alert('\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3002');
												  console.error('Failed to delete keys:', error);
												}
										});

										checkKeysBtn.addEventListener('click', async () => {
											const rows = keysTableBody.querySelectorAll('tr[data-key]');
											const keysToCheck = Array.from(rows).map(row => row.dataset.key);

											rows.forEach(row => {
												const statusCell = row.querySelector('.status-cell');
												if (statusCell) {
													statusCell.textContent = '\u68C0\u67E5\u4E2D...';
													statusCell.className = 'p-2 status-cell text-gray-500';
												}
											});

											try {
												const response = await fetch('/api/keys/check', {
													method: 'POST',
													headers: { 'Content-Type': 'application/json' },
													body: JSON.stringify({ keys: keysToCheck }),
												});
												if (response.ok) {
													alert('\u68C0\u67E5\u5B8C\u6210\u3002');
													fetchAndRenderKeys();
												} else {
													const result = await response.json();
													alert(\`\u68C0\u67E5\u5BC6\u94A5\u5931\u8D25: \${result.error || '\u672A\u77E5\u9519\u8BEF'}\`);
												}
											} catch (error) {
												alert('\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3002');
												console.error('Failed to check keys:', error);
											}
										});

										selectInvalidKeysBtn.addEventListener('click', () => {
											const rows = keysTableBody.querySelectorAll('tr');
											rows.forEach(row => {
												const statusCell = row.querySelector('.status-cell');
												if (statusCell && statusCell.textContent === '\u65E0\u6548') {
													const checkbox = row.querySelector('.key-checkbox');
													if (checkbox) {
														checkbox.checked = true;
													}
												}
											});
											updateDeleteButtonVisibility();
										});

										addKeysForm.addEventListener('submit', async (e) => {
												e.preventDefault();
												const keys = apiKeysTextarea.value.split('\\n').map(k => k.trim()).filter(k => k !== '');
												if (keys.length === 0) {
												  alert('\u8BF7\u8F93\u5165\u81F3\u5C11\u4E00\u4E2AAPI\u5BC6\u94A5\u3002');
												  return;
												}
												try {
												  const response = await fetch('/api/keys', {
												    method: 'POST',
												    headers: { 'Content-Type': 'application/json' },
												    body: JSON.stringify({ keys }),
												  });
												  const result = await response.json();
												  if (response.ok) {
												    alert(result.message || '\u5BC6\u94A5\u6DFB\u52A0\u6210\u529F\u3002');
												    apiKeysTextarea.value = '';
												    fetchAndRenderKeys();
												  } else {
												    alert(\`\u6DFB\u52A0\u5BC6\u94A5\u5931\u8D25: \${result.error || '\u672A\u77E5\u9519\u8BEF'}\`);
												  }
												} catch (error) {
												  alert('\u8BF7\u6C42\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3002');
												  console.error('Failed to add keys:', error);
												}
										});

										refreshKeysBtn.addEventListener('click', fetchAndRenderKeys);

										prevPageBtn.addEventListener('click', () => {
												if (currentPage > 1) {
												  currentPage--;
												  fetchAndRenderKeys();
												}
										});

										nextPageBtn.addEventListener('click', () => {
												if (currentPage < totalPages) {
												  currentPage++;
												  fetchAndRenderKeys();
												}
										});

										// Initial load
										fetchAndRenderKeys();
								});
				  `
          }
        }
      )
    ] })
  ] });
};

// src/handler.ts
import { DurableObject } from "cloudflare:workers";

// src/auth.ts
function getAuthKey(request, sessionKey) {
  if (sessionKey) return sessionKey;
  const cookie = request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\\s*)auth-key=([^;]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    return authHeader.replace(/^Bearer\s+/, "");
  }
  return void 0;
}
function isAdminAuthenticated(request, homeAccessKey) {
  if (!homeAccessKey) return false;
  const key = getAuthKey(request);
  return key === homeAccessKey;
}

// src/handler.ts
var HttpError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
};
var fixCors = ({ headers, status, statusText }) => {
  const newHeaders = new Headers(headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key");
  return { headers: newHeaders, status, statusText };
};
var BASE_URL = "https://generativelanguage.googleapis.com";
var API_VERSION = "v1beta";
var API_CLIENT = "genai-js/0.21.0";
var makeHeaders = (apiKey, more) => ({
  "x-goog-api-client": API_CLIENT,
  ...apiKey && { "x-goog-api-key": apiKey },
  ...more
});
var LoadBalancer = class extends DurableObject {
  /**
   * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
   * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
   *
   * @param ctx - The interface for interacting with Durable Object state
   * @param env - The interface to reference bindings declared in wrangler.jsonc
   */
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS api_keys (
				api_key TEXT PRIMARY KEY
			);
			CREATE TABLE IF NOT EXISTS api_key_statuses (
				api_key TEXT PRIMARY KEY,
				status TEXT CHECK(status IN ('normal', 'abnormal')) NOT NULL DEFAULT 'normal',
				last_checked_at INTEGER,
				failed_count INTEGER NOT NULL DEFAULT 0,
				key_group TEXT CHECK(key_group IN ('normal', 'abnormal')) NOT NULL DEFAULT 'normal',
				FOREIGN KEY(api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
			);
		`);
    this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1e3);
  }
  async alarm() {
    const abnormalKeys = await this.ctx.storage.sql.exec("SELECT api_key, failed_count FROM api_key_statuses WHERE key_group = 'abnormal'").raw();
    for (const row of Array.from(abnormalKeys)) {
      const apiKey = row[0];
      const failedCount = row[1];
      try {
        const response = await fetch(`${BASE_URL}/${API_VERSION}/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }]
          })
        });
        if (response.ok) {
          await this.ctx.storage.sql.exec(
            "UPDATE api_key_statuses SET key_group = 'normal', failed_count = 0, last_checked_at = ? WHERE api_key = ?",
            Date.now(),
            apiKey
          );
        } else if (response.status === 429) {
          const newFailedCount = failedCount + 1;
          if (newFailedCount >= 5) {
            await this.ctx.storage.sql.exec("DELETE FROM api_keys WHERE api_key = ?", apiKey);
          } else {
            await this.ctx.storage.sql.exec(
              "UPDATE api_key_statuses SET failed_count = ?, last_checked_at = ? WHERE api_key = ?",
              newFailedCount,
              Date.now(),
              apiKey
            );
          }
        }
      } catch (e) {
        console.error(`Error checking abnormal key ${apiKey}:`, e);
      }
    }
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1e3;
    const normalKeys = await this.ctx.storage.sql.exec(
      "SELECT api_key FROM api_key_statuses WHERE key_group = 'normal' AND (last_checked_at IS NULL OR last_checked_at < ?)",
      twelveHoursAgo
    ).raw();
    for (const row of Array.from(normalKeys)) {
      const apiKey = row[0];
      try {
        const response = await fetch(`${BASE_URL}/${API_VERSION}/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "hi" }] }]
          })
        });
        if (response.status === 429) {
          await this.ctx.storage.sql.exec(
            "UPDATE api_key_statuses SET key_group = 'abnormal', failed_count = 1, last_checked_at = ? WHERE api_key = ?",
            Date.now(),
            apiKey
          );
        } else {
          await this.ctx.storage.sql.exec("UPDATE api_key_statuses SET last_checked_at = ? WHERE api_key = ?", Date.now(), apiKey);
        }
      } catch (e) {
        console.error(`Error checking normal key ${apiKey}:`, e);
      }
    }
    this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1e3);
  }
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: fixCors({}).headers
      });
    }
    const url = new URL(request.url);
    const pathname = url.pathname;
    if (pathname === "/favicon.ico" || pathname === "/robots.txt") {
      return new Response("", { status: 204 });
    }
    if (pathname === "/api/keys" || pathname === "/api/keys/check") {
      if (!isAdminAuthenticated(request, this.env.HOME_ACCESS_KEY)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: fixCors({ headers: { "Content-Type": "application/json" } }).headers
        });
      }
      if (pathname === "/api/keys" && request.method === "POST") {
        return this.handleApiKeys(request);
      }
      if (pathname === "/api/keys" && request.method === "GET") {
        return this.getAllApiKeys(request);
      }
      if (pathname === "/api/keys" && request.method === "DELETE") {
        return this.handleDeleteApiKeys(request);
      }
      if (pathname === "/api/keys/check" && request.method === "POST") {
        return this.handleApiKeysCheck(request);
      }
    }
    const search = url.search;
    if (pathname.endsWith("/chat/completions") || pathname.endsWith("/completions") || pathname.endsWith("/embeddings") || pathname.endsWith("/v1/models")) {
      return this.handleOpenAI(request);
    }
    const authKey = this.env.AUTH_KEY;
    let targetUrl = `${BASE_URL}${pathname}${search}`;
    if (this.env.FORWARD_CLIENT_KEY_ENABLED) {
      return this.forwardRequestWithLoadBalancing(targetUrl, request);
    }
    if (authKey) {
      let isAuthorized = false;
      if (search.includes("key=")) {
        const urlObj = new URL(targetUrl);
        const requestKey = urlObj.searchParams.get("key");
        if (requestKey && requestKey === authKey) {
          isAuthorized = true;
        }
      } else {
        const requestKey = request.headers.get("x-goog-api-key");
        if (requestKey && requestKey === authKey) {
          isAuthorized = true;
        }
      }
      if (!isAuthorized) {
        return new Response("Unauthorized", { status: 401, headers: fixCors({}).headers });
      }
    }
    return this.forwardRequestWithLoadBalancing(targetUrl, request);
  }
  async forwardRequest(targetUrl, request, headers, apiKey) {
    console.log(`Request Sending to Gemini: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? null : request.body
    });
    if (response.status === 429) {
      console.log(`API key ${apiKey} received 429 status code.`);
      await this.ctx.storage.sql.exec(
        "UPDATE api_key_statuses SET key_group = 'abnormal', failed_count = failed_count + 1, last_checked_at = ? WHERE api_key = ?",
        Date.now(),
        apiKey
      );
    }
    console.log("Call Gemini Success");
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("connection");
    responseHeaders.delete("keep-alive");
    responseHeaders.delete("content-encoding");
    responseHeaders.set("Referrer-Policy", "no-referrer");
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  }
  // 对请求进行负载均衡，随机分发key
  async forwardRequestWithLoadBalancing(targetUrl, request) {
    try {
      let headers = new Headers();
      const url = new URL(targetUrl);
      if (request.headers.has("content-type")) {
        headers.set("content-type", request.headers.get("content-type"));
      }
      if (this.env.FORWARD_CLIENT_KEY_ENABLED) {
        const clientApiKey = this.extractClientApiKey(request, url);
        if (clientApiKey) {
          url.searchParams.set("key", clientApiKey);
          headers.set("x-goog-api-key", clientApiKey);
        }
        return this.forwardRequest(url.toString(), request, headers, clientApiKey || "");
      }
      const apiKey = await this.getRandomApiKey();
      if (!apiKey) {
        return new Response("No API keys configured in the load balancer.", { status: 500 });
      }
      url.searchParams.set("key", apiKey);
      headers.set("x-goog-api-key", apiKey);
      return this.forwardRequest(url.toString(), request, headers, apiKey);
    } catch (error) {
      console.error("Failed to fetch:", error);
      return new Response("Internal Server Error\n" + error, {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
  async handleModels(apiKey) {
    const response = await fetch(`${BASE_URL}/${API_VERSION}/models`, {
      headers: makeHeaders(apiKey)
    });
    let responseBody = response.body;
    if (response.ok) {
      const { models } = JSON.parse(await response.text());
      responseBody = JSON.stringify(
        {
          object: "list",
          data: models.map(({ name }) => ({
            id: name.replace("models/", ""),
            object: "model",
            created: 0,
            owned_by: ""
          }))
        },
        null,
        "  "
      );
    }
    return new Response(responseBody, fixCors(response));
  }
  async handleEmbeddings(req, apiKey) {
    const DEFAULT_EMBEDDINGS_MODEL = "text-embedding-004";
    if (typeof req.model !== "string") {
      throw new HttpError("model is not specified", 400);
    }
    let model;
    if (req.model.startsWith("models/")) {
      model = req.model;
    } else {
      if (!req.model.startsWith("gemini-")) {
        req.model = DEFAULT_EMBEDDINGS_MODEL;
      }
      model = "models/" + req.model;
    }
    if (!Array.isArray(req.input)) {
      req.input = [req.input];
    }
    const response = await fetch(`${BASE_URL}/${API_VERSION}/${model}:batchEmbedContents`, {
      method: "POST",
      headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        requests: req.input.map((text) => ({
          model,
          content: { parts: { text } },
          outputDimensionality: req.dimensions
        }))
      })
    });
    let responseBody = response.body;
    if (response.ok) {
      const { embeddings } = JSON.parse(await response.text());
      responseBody = JSON.stringify(
        {
          object: "list",
          data: embeddings.map(({ values }, index) => ({
            object: "embedding",
            index,
            embedding: values
          })),
          model: req.model
        },
        null,
        "  "
      );
    }
    return new Response(responseBody, fixCors(response));
  }
  async handleCompletions(req, apiKey) {
    const DEFAULT_MODEL = "gemini-2.5-flash";
    let model = DEFAULT_MODEL;
    switch (true) {
      case typeof req.model !== "string":
        break;
      case req.model.startsWith("models/"):
        model = req.model.substring(7);
        break;
      case req.model.startsWith("gemini-"):
      case req.model.startsWith("gemma-"):
      case req.model.startsWith("learnlm-"):
        model = req.model;
    }
    let body = await this.transformRequest(req);
    const extra = req.extra_body?.google;
    if (extra) {
      if (extra.safety_settings) {
        body.safetySettings = extra.safety_settings;
      }
      if (extra.cached_content) {
        body.cachedContent = extra.cached_content;
      }
      if (extra.thinking_config) {
        body.generationConfig.thinkingConfig = extra.thinking_config;
      }
    }
    switch (true) {
      case model.endsWith(":search"):
        model = model.substring(0, model.length - 7);
      case req.model.endsWith("-search-preview"):
      case req.tools?.some((tool) => tool.function?.name === "googleSearch"):
        body.tools = body.tools || [];
        body.tools.push({ function_declarations: [{ name: "googleSearch", parameters: {} }] });
    }
    const TASK = req.stream ? "streamGenerateContent" : "generateContent";
    let url = `${BASE_URL}/${API_VERSION}/models/${model}:${TASK}`;
    if (req.stream) {
      url += "?alt=sse";
    }
    const response = await fetch(url, {
      method: "POST",
      headers: makeHeaders(apiKey, { "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    });
    let responseBody = response.body;
    if (response.ok) {
      let id = "chatcmpl-" + this.generateId();
      const shared = {};
      if (req.stream) {
        responseBody = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(
          new TransformStream({
            transform: this.parseStream,
            flush: this.parseStreamFlush,
            buffer: "",
            shared
          })
        ).pipeThrough(
          new TransformStream({
            transform: this.toOpenAiStream,
            flush: this.toOpenAiStreamFlush,
            streamIncludeUsage: req.stream_options?.include_usage,
            model,
            id,
            last: [],
            reasoningLast: [],
            shared
          })
        ).pipeThrough(new TextEncoderStream());
      } else {
        let body2 = await response.text();
        try {
          body2 = JSON.parse(body2);
          if (!body2.candidates) {
            throw new Error("Invalid completion object");
          }
        } catch (err) {
          console.error("Error parsing response:", err);
          return new Response(JSON.stringify({ error: "Failed to parse response" }), {
            ...fixCors(response),
            status: 500
          });
        }
        responseBody = this.processCompletionsResponse(body2, model, id);
      }
    }
    return new Response(responseBody, fixCors(response));
  }
  // 辅助方法
  generateId() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomChar = () => characters[Math.floor(Math.random() * characters.length)];
    return Array.from({ length: 29 }, randomChar).join("");
  }
  async transformRequest(req) {
    const harmCategory = [
      "HARM_CATEGORY_HATE_SPEECH",
      "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "HARM_CATEGORY_DANGEROUS_CONTENT",
      "HARM_CATEGORY_HARASSMENT",
      "HARM_CATEGORY_CIVIC_INTEGRITY"
    ];
    const safetySettings = harmCategory.map((category) => ({
      category,
      threshold: "BLOCK_NONE"
    }));
    return {
      ...await this.transformMessages(req.messages),
      safetySettings,
      generationConfig: this.transformConfig(req),
      ...this.transformTools(req),
      cachedContent: void 0
    };
  }
  transformConfig(req) {
    const fieldsMap = {
      frequency_penalty: "frequencyPenalty",
      max_completion_tokens: "maxOutputTokens",
      max_tokens: "maxOutputTokens",
      n: "candidateCount",
      presence_penalty: "presencePenalty",
      seed: "seed",
      stop: "stopSequences",
      temperature: "temperature",
      top_k: "topK",
      top_p: "topP"
    };
    const thinkingBudgetMap = {
      low: 1024,
      medium: 8192,
      high: 24576
    };
    let cfg = {};
    for (let key in req) {
      const matchedKey = fieldsMap[key];
      if (matchedKey) {
        cfg[matchedKey] = req[key];
      }
    }
    if (req.response_format) {
      switch (req.response_format.type) {
        case "json_schema":
          cfg.responseSchema = req.response_format.json_schema?.schema;
          if (cfg.responseSchema && "enum" in cfg.responseSchema) {
            cfg.responseMimeType = "text/x.enum";
            break;
          }
        case "json_object":
          cfg.responseMimeType = "application/json";
          break;
        case "text":
          cfg.responseMimeType = "text/plain";
          break;
        default:
          throw new HttpError("Unsupported response_format.type", 400);
      }
    }
    if (req.reasoning_effort) {
      cfg.thinkingConfig = { thinkingBudget: thinkingBudgetMap[req.reasoning_effort] };
    }
    return cfg;
  }
  async transformMessages(messages) {
    if (!messages) {
      return {};
    }
    const contents = [];
    let system_instruction;
    for (const item of messages) {
      switch (item.role) {
        case "system":
          system_instruction = { parts: await this.transformMsg(item) };
          continue;
        case "assistant":
          item.role = "model";
          break;
        case "user":
          break;
        default:
          throw new HttpError(`Unknown message role: "${item.role}"`, 400);
      }
      if (system_instruction) {
        if (!contents[0]?.parts || Array.isArray(contents[0]?.parts) && !contents[0]?.parts.some((part) => part.text)) {
          contents.unshift({ role: "user", parts: [{ text: " " }] });
        }
      }
      contents.push({
        role: item.role,
        parts: await this.transformMsg(item)
      });
    }
    return { system_instruction, contents };
  }
  async transformMsg({ content }) {
    const parts = [];
    if (!Array.isArray(content)) {
      parts.push({ text: content });
      return parts;
    }
    for (const item of content) {
      switch (item.type) {
        case "text":
          parts.push({ text: item.text });
          break;
        case "image_url":
          parts.push(await this.parseImg(item.image_url.url));
          break;
        case "input_audio":
          parts.push({
            inlineData: {
              mimeType: "audio/" + item.input_audio.format,
              data: item.input_audio.data
            }
          });
          break;
        default:
          throw new HttpError(`Unknown "content" item type: "${item.type}"`, 400);
      }
    }
    if (content.every((item) => item.type === "image_url")) {
      parts.push({ text: "" });
    }
    return parts;
  }
  async parseImg(url) {
    let mimeType, data;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText} (${url})`);
        }
        mimeType = response.headers.get("content-type");
        data = Buffer.from(await response.arrayBuffer()).toString("base64");
      } catch (err) {
        throw new Error("Error fetching image: " + err.message);
      }
    } else {
      const match = url.match(/^data:(?<mimeType>.*?)(;base64)?,(?<data>.*)$/);
      if (!match) {
        throw new HttpError("Invalid image data: " + url, 400);
      }
      ({ mimeType, data } = match.groups);
    }
    return {
      inlineData: {
        mimeType,
        data
      }
    };
  }
  adjustSchema(schema) {
    const obj = schema[schema.type];
    delete obj.strict;
    return this.adjustProps(schema);
  }
  adjustProps(schemaPart) {
    if (typeof schemaPart !== "object" || schemaPart === null) {
      return;
    }
    if (Array.isArray(schemaPart)) {
      schemaPart.forEach(this.adjustProps);
    } else {
      if (schemaPart.type === "object" && schemaPart.properties && schemaPart.additionalProperties === false) {
        delete schemaPart.additionalProperties;
      }
      Object.values(schemaPart).forEach(this.adjustProps);
    }
  }
  transformTools(req) {
    let tools, tool_config;
    if (req.tools) {
      const funcs = req.tools.filter((tool) => tool.type === "function" && tool.function?.name !== "googleSearch");
      if (funcs.length > 0) {
        funcs.forEach(this.adjustSchema);
        tools = [{ function_declarations: funcs.map((schema) => schema.function) }];
      }
    }
    if (req.tool_choice) {
      const allowed_function_names = req.tool_choice?.type === "function" ? [req.tool_choice?.function?.name] : void 0;
      if (allowed_function_names || typeof req.tool_choice === "string") {
        tool_config = {
          function_calling_config: {
            mode: allowed_function_names ? "ANY" : req.tool_choice.toUpperCase(),
            allowed_function_names
          }
        };
      }
    }
    return { tools, tool_config };
  }
  processCompletionsResponse(data, model, id) {
    const reasonsMap = {
      STOP: "stop",
      MAX_TOKENS: "length",
      SAFETY: "content_filter",
      RECITATION: "content_filter"
    };
    const transformCandidatesMessage = (cand) => {
      const message = { role: "assistant", content: [] };
      let reasoningContent = "";
      let finalContent = "";
      for (const part of cand.content?.parts ?? []) {
        if (part.text) {
          const isThoughtContent = part.thoughtToken || part.thought || part.thoughtTokens || part.executableCode && part.executableCode.language === "thought" || // 检查文本是否以思考标记开头
          part.text && (part.text.startsWith("<thinking>") || part.text.startsWith("\u601D\u8003\uFF1A") || part.text.startsWith("Thinking:"));
          if (isThoughtContent) {
            let cleanText = part.text;
            if (cleanText.startsWith("<thinking>")) {
              cleanText = cleanText.replace("<thinking>", "").replace("</thinking>", "");
            } else if (cleanText.startsWith("\u601D\u8003\uFF1A")) {
              cleanText = cleanText.replace("\u601D\u8003\uFF1A", "");
            } else if (cleanText.startsWith("Thinking:")) {
              cleanText = cleanText.replace("Thinking:", "");
            }
            reasoningContent += cleanText;
          } else {
            finalContent += part.text;
          }
        }
      }
      const messageObj = {
        index: cand.index || 0,
        message: {
          role: "assistant",
          content: finalContent || null
        },
        logprobs: null,
        finish_reason: reasonsMap[cand.finishReason] || cand.finishReason
      };
      if (reasoningContent) {
        messageObj.message.reasoning_content = reasoningContent;
      }
      return messageObj;
    };
    const obj = {
      id,
      choices: data.candidates.map(transformCandidatesMessage),
      created: Math.floor(Date.now() / 1e3),
      model: data.modelVersion ?? model,
      object: "chat.completion",
      usage: data.usageMetadata && {
        completion_tokens: data.usageMetadata.candidatesTokenCount,
        prompt_tokens: data.usageMetadata.promptTokenCount,
        total_tokens: data.usageMetadata.totalTokenCount
      }
    };
    return JSON.stringify(obj);
  }
  // 流处理方法
  parseStream(chunk, controller) {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop();
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.substring(6);
        if (data.startsWith("{")) {
          controller.enqueue(JSON.parse(data));
        }
      }
    }
  }
  parseStreamFlush(controller) {
    if (this.buffer) {
      try {
        controller.enqueue(JSON.parse(this.buffer));
        this.shared.is_buffers_rest = true;
      } catch (e) {
        console.error("Error parsing remaining buffer:", e);
      }
    }
  }
  toOpenAiStream(line, controller) {
    const reasonsMap = {
      STOP: "stop",
      MAX_TOKENS: "length",
      SAFETY: "content_filter",
      RECITATION: "content_filter"
    };
    const { candidates, usageMetadata } = line;
    if (usageMetadata) {
      this.shared.usage = {
        completion_tokens: usageMetadata.candidatesTokenCount,
        prompt_tokens: usageMetadata.promptTokenCount,
        total_tokens: usageMetadata.totalTokenCount
      };
    }
    if (candidates) {
      for (const cand of candidates) {
        const { index, content, finishReason } = cand;
        const { parts } = content;
        let reasoningText = "";
        let finalText = "";
        for (const part of parts) {
          if (part.text) {
            const isThoughtContent = part.thoughtToken || part.thought || part.thoughtTokens || part.executableCode && part.executableCode.language === "thought" || // 检查文本是否以思考标记开头
            part.text && (part.text.startsWith("<thinking>") || part.text.startsWith("\u601D\u8003\uFF1A") || part.text.startsWith("Thinking:"));
            if (isThoughtContent) {
              let cleanText = part.text;
              if (cleanText.startsWith("<thinking>")) {
                cleanText = cleanText.replace("<thinking>", "").replace("</thinking>", "");
              } else if (cleanText.startsWith("\u601D\u8003\uFF1A")) {
                cleanText = cleanText.replace("\u601D\u8003\uFF1A", "");
              } else if (cleanText.startsWith("Thinking:")) {
                cleanText = cleanText.replace("Thinking:", "");
              }
              reasoningText += cleanText;
            } else {
              finalText += part.text;
            }
          }
        }
        if (reasoningText) {
          if (!this.reasoningLast) this.reasoningLast = {};
          if (this.reasoningLast[index] === void 0) {
            this.reasoningLast[index] = "";
          }
          const lastReasoningText = this.reasoningLast[index] || "";
          let reasoningDelta = "";
          if (reasoningText.startsWith(lastReasoningText)) {
            reasoningDelta = reasoningText.substring(lastReasoningText.length);
          } else {
            let i = 0;
            while (i < reasoningText.length && i < lastReasoningText.length && reasoningText[i] === lastReasoningText[i]) {
              i++;
            }
            reasoningDelta = reasoningText.substring(i);
          }
          this.reasoningLast[index] = reasoningText;
          if (reasoningDelta) {
            const reasoningObj = {
              id: this.id,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1e3),
              model: this.model,
              choices: [
                {
                  index,
                  delta: { reasoning_content: reasoningDelta },
                  finish_reason: null
                }
              ]
            };
            controller.enqueue(`data: ${JSON.stringify(reasoningObj)}

`);
          }
        }
        if (finalText) {
          if (this.last[index] === void 0) {
            this.last[index] = "";
          }
          const lastText = this.last[index] || "";
          let delta = "";
          if (finalText.startsWith(lastText)) {
            delta = finalText.substring(lastText.length);
          } else {
            let i = 0;
            while (i < finalText.length && i < lastText.length && finalText[i] === lastText[i]) {
              i++;
            }
            delta = finalText.substring(i);
          }
          this.last[index] = finalText;
          if (delta) {
            const obj = {
              id: this.id,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1e3),
              model: this.model,
              choices: [
                {
                  index,
                  delta: { content: delta },
                  finish_reason: null
                }
              ]
            };
            controller.enqueue(`data: ${JSON.stringify(obj)}

`);
          }
        }
        if (finishReason) {
          const finishObj = {
            id: this.id,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1e3),
            model: this.model,
            choices: [
              {
                index,
                delta: {},
                finish_reason: reasonsMap[finishReason] || finishReason
              }
            ]
          };
          controller.enqueue(`data: ${JSON.stringify(finishObj)}

`);
        }
      }
    }
  }
  toOpenAiStreamFlush(controller) {
    if (this.streamIncludeUsage && this.shared.usage) {
      const obj = {
        id: this.id,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1e3),
        model: this.model,
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: "stop"
          }
        ],
        usage: this.shared.usage
      };
      controller.enqueue(`data: ${JSON.stringify(obj)}

`);
    }
    controller.enqueue("data: [DONE]\n\n");
  }
  // =================================================================================================
  // Admin API Handlers
  // =================================================================================================
  async handleApiKeys(request) {
    try {
      const { keys } = await request.json();
      if (!Array.isArray(keys) || keys.length === 0) {
        return new Response(JSON.stringify({ error: "\u8BF7\u6C42\u4F53\u65E0\u6548\uFF0C\u9700\u8981\u4E00\u4E2A\u5305\u542Bkey\u7684\u975E\u7A7A\u6570\u7EC4\u3002" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      for (const key of keys) {
        await this.ctx.storage.sql.exec("INSERT OR IGNORE INTO api_keys (api_key) VALUES (?)", key);
        await this.ctx.storage.sql.exec("INSERT OR IGNORE INTO api_key_statuses (api_key) VALUES (?)", key);
      }
      return new Response(JSON.stringify({ message: "API\u5BC6\u94A5\u6DFB\u52A0\u6210\u529F\u3002" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("\u5904\u7406API\u5BC6\u94A5\u5931\u8D25:", error);
      return new Response(JSON.stringify({ error: error.message || "\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  async handleDeleteApiKeys(request) {
    try {
      const { keys } = await request.json();
      if (!Array.isArray(keys) || keys.length === 0) {
        return new Response(JSON.stringify({ error: "\u8BF7\u6C42\u4F53\u65E0\u6548\uFF0C\u9700\u8981\u4E00\u4E2A\u5305\u542Bkey\u7684\u975E\u7A7A\u6570\u7EC4\u3002" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const batchSize = 500;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const placeholders = batch.map(() => "?").join(",");
        await this.ctx.storage.sql.exec(`DELETE FROM api_keys WHERE api_key IN (${placeholders})`, ...batch);
      }
      return new Response(JSON.stringify({ message: "API\u5BC6\u94A5\u5220\u9664\u6210\u529F\u3002" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("\u5220\u9664API\u5BC6\u94A5\u5931\u8D25:", error);
      return new Response(JSON.stringify({ error: error.message || "\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  async handleApiKeysCheck(request) {
    try {
      const { keys } = await request.json();
      if (!Array.isArray(keys) || keys.length === 0) {
        return new Response(JSON.stringify({ error: "\u8BF7\u6C42\u4F53\u65E0\u6548\uFF0C\u9700\u8981\u4E00\u4E2A\u5305\u542Bkey\u7684\u975E\u7A7A\u6570\u7EC4\u3002" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const checkResults = await Promise.all(
        keys.map(async (key) => {
          try {
            const response = await fetch(`${BASE_URL}/${API_VERSION}/models/gemini-2.5-flash:generateContent?key=${key}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "hi" }] }]
              })
            });
            return { key, valid: response.ok, error: response.ok ? null : await response.text() };
          } catch (e) {
            return { key, valid: false, error: e.message };
          }
        })
      );
      for (const result of checkResults) {
        if (result.valid) {
          await this.ctx.storage.sql.exec(
            "UPDATE api_key_statuses SET status = 'normal', key_group = 'normal', failed_count = 0, last_checked_at = ? WHERE api_key = ?",
            Date.now(),
            result.key
          );
        } else {
          await this.ctx.storage.sql.exec("DELETE FROM api_keys WHERE api_key = ?", result.key);
        }
      }
      return new Response(JSON.stringify(checkResults), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("\u68C0\u67E5API\u5BC6\u94A5\u5931\u8D25:", error);
      return new Response(JSON.stringify({ error: error.message || "\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  async getAllApiKeys(request) {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);
      const offset = (page - 1) * pageSize;
      const totalResult = await this.ctx.storage.sql.exec("SELECT COUNT(*) as count FROM api_key_statuses").raw();
      const totalArray = Array.from(totalResult);
      const total = totalArray.length > 0 ? totalArray[0][0] : 0;
      const results = await this.ctx.storage.sql.exec("SELECT api_key, status, key_group, last_checked_at, failed_count FROM api_key_statuses LIMIT ? OFFSET ?", pageSize, offset).raw();
      const keys = results ? Array.from(results).map((row) => ({
        api_key: row[0],
        status: row[1],
        key_group: row[2],
        last_checked_at: row[3],
        failed_count: row[4]
      })) : [];
      return new Response(JSON.stringify({ keys, total }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("\u83B7\u53D6API\u5BC6\u94A5\u5931\u8D25:", error);
      return new Response(JSON.stringify({ error: error.message || "\u5185\u90E8\u670D\u52A1\u5668\u9519\u8BEF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  // =================================================================================================
  // Helper Methods
  // =================================================================================================
  /**
   * 从请求中提取客户端的 API key
   * 支持多种传递方式：查询参数、x-goog-api-key header、Authorization header
   */
  extractClientApiKey(request, url) {
    if (url.searchParams.has("key")) {
      const key = url.searchParams.get("key");
      if (key) return key;
    }
    const googApiKey = request.headers.get("x-goog-api-key");
    if (googApiKey) return googApiKey;
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    return null;
  }
  async getRandomApiKey() {
    try {
      let results = await this.ctx.storage.sql.exec("SELECT api_key FROM api_key_statuses WHERE key_group = 'normal' ORDER BY RANDOM() LIMIT 1").raw();
      let keys = Array.from(results);
      if (keys && keys.length > 0) {
        const key = keys[0][0];
        console.log(`Gemini Selected API Key from normal group: ${key}`);
        return key;
      }
      results = await this.ctx.storage.sql.exec("SELECT api_key FROM api_key_statuses WHERE key_group = 'abnormal' ORDER BY RANDOM() LIMIT 1").raw();
      keys = Array.from(results);
      if (keys && keys.length > 0) {
        const key = keys[0][0];
        console.log(`Gemini Selected API Key from abnormal group: ${key}`);
        return key;
      }
      return null;
    } catch (error) {
      console.error("\u83B7\u53D6\u968F\u673AAPI\u5BC6\u94A5\u5931\u8D25:", error);
      return null;
    }
  }
  async handleOpenAI(request) {
    const authKey = this.env.AUTH_KEY;
    let apiKey;
    const authHeader = request.headers.get("Authorization");
    apiKey = authHeader?.replace("Bearer ", "") ?? null;
    if (this.env.FORWARD_CLIENT_KEY_ENABLED) {
      if (!apiKey) {
        return new Response("No API key found in the client headers,please check your request!", { status: 400 });
      }
    } else {
      if (!apiKey) {
        return new Response("No API key found in the client headers,please check your request!", { status: 400 });
      }
      if (authKey) {
        const token = authHeader?.replace("Bearer ", "");
        if (token !== authKey) {
          return new Response("Unauthorized", { status: 401, headers: fixCors({}).headers });
        }
        apiKey = await this.getRandomApiKey();
        if (!apiKey) {
          return new Response("No API keys configured in the load balancer.", { status: 500 });
        }
      }
    }
    const url = new URL(request.url);
    const pathname = url.pathname;
    const assert = (success) => {
      if (!success) {
        throw new HttpError("The specified HTTP method is not allowed for the requested resource", 400);
      }
    };
    const errHandler = (err) => {
      console.error(err);
      return new Response(err.message, fixCors({ statusText: err.message ?? "Internal Server Error", status: 500 }));
    };
    switch (true) {
      case pathname.endsWith("/chat/completions"):
        assert(request.method === "POST");
        return this.handleCompletions(await request.json(), apiKey).catch(errHandler);
      case pathname.endsWith("/embeddings"):
        assert(request.method === "POST");
        return this.handleEmbeddings(await request.json(), apiKey).catch(errHandler);
      case pathname.endsWith("/models"):
        assert(request.method === "GET");
        return this.handleModels(apiKey).catch(errHandler);
      default:
        throw new HttpError("404 Not Found", 404);
    }
  }
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
};
var _serialize = (name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/.pnpm/hono@4.8.12/node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
};
var setCookie = (c, name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  c.header("Set-Cookie", cookie, { append: true });
};

// src/index.ts
var app = new Hono2();
app.get("/", (c) => {
  const sessionKey = getCookie(c, "auth-key");
  const authKey = getAuthKey(c.req.raw, sessionKey);
  if (authKey !== c.env.HOME_ACCESS_KEY) {
    return c.html(Render({ isAuthenticated: false, showWarning: false }));
  }
  const showWarning = c.env.HOME_ACCESS_KEY === "7b18e536c27ab304266db3220b8e000db8fbbe35d6e1fde729a1a1d47303858d" || c.env.AUTH_KEY === "ajielu";
  return c.html(Render({ isAuthenticated: true, showWarning }));
});
app.post("/", async (c) => {
  const { key } = await c.req.json();
  if (key === c.env.HOME_ACCESS_KEY) {
    setCookie(c, "auth-key", key, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    return c.json({ success: true });
  }
  return c.json({ success: false }, 401);
});
app.get("/favicon.ico", async (c) => {
  return c.text("Not found", 404);
});
app.all("*", async (c) => {
  const id = c.env.LOAD_BALANCER.idFromName("loadbalancer");
  const stub = c.env.LOAD_BALANCER.get(id, { locationHint: "wnam" });
  const resp = await stub.fetch(c.req.raw);
  return new Response(resp.body, {
    status: resp.status,
    headers: resp.headers
  });
});
var index_default = {
  fetch: app.fetch
};
export {
  LoadBalancer,
  index_default as default
};
//# sourceMappingURL=_worker.js.map
