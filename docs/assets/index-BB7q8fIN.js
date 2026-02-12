(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var SSR_NODE = 1;
var TEXT_NODE = 3;
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var SVG_NS = "http://www.w3.org/2000/svg";
var id = (a) => a;
var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var enqueue = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;
var createClass = (obj) => {
  var out = "";
  if (typeof obj === "string") return obj;
  if (isArray(obj)) {
    for (var k = 0, tmp; k < obj.length; k++) {
      if (tmp = createClass(obj[k])) {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k in obj) {
      if (obj[k]) out += (out && " ") + k;
    }
  }
  return out;
};
var shouldRestart = (a, b) => {
  for (var k in { ...a, ...b }) {
    if (typeof (isArray(a[k]) ? a[k][0] : a[k]) === "function") {
      b[k] = a[k];
    } else if (a[k] !== b[k]) return true;
  }
};
var patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch) => {
  for (var subs = [], i = 0, oldSub, newSub; i < oldSubs.length || i < newSubs.length; i++) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];
    subs.push(
      newSub && newSub !== true ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [
        newSub[0],
        newSub[1],
        (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1]))
      ] : oldSub : oldSub && oldSub[2]()
    );
  }
  return subs;
};
var getKey = (vdom) => vdom == null ? vdom : vdom.key;
var patchProperty = (node, key, oldValue, newValue, listener, isSvg) => {
  if (key === "style") {
    for (var k in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (!((node.events || (node.events = {}))[key = key.slice(2)] = newValue)) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
    node[key] = newValue == null ? "" : newValue;
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};
var createNode = (vdom, listener, isSvg) => {
  var props = vdom.props;
  var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.tag) : (isSvg = isSvg || vdom.tag === "svg") ? document.createElementNS(SVG_NS, vdom.tag, props.is && props) : document.createElement(vdom.tag, props.is && props);
  for (var k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }
  for (var i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode(
        vdom.children[i] = maybeVNode(vdom.children[i]),
        listener,
        isSvg
      )
    );
  }
  return vdom.node = node;
};
var patch = (parent, node, oldVNode, newVNode, listener, isSvg) => {
  if (oldVNode === newVNode) ;
  else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode(newVNode = maybeVNode(newVNode), listener, isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    var tmpVKid;
    var oldVKid;
    var oldKey;
    var newKey;
    var oldProps = oldVNode.props;
    var newProps = newVNode.props;
    var oldVKids = oldVNode.children;
    var newVKids = newVNode.children;
    var oldHead = 0;
    var newHead = 0;
    var oldTail = oldVKids.length - 1;
    var newTail = newVKids.length - 1;
    isSvg = isSvg || newVNode.tag === "svg";
    for (var i in { ...oldProps, ...newProps }) {
      if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldProps[i]) !== newProps[i]) {
        patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
      }
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) {
        break;
      }
      patch(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead],
        newVKids[newHead] = maybeVNode(
          newVKids[newHead++],
          oldVKids[oldHead++]
        ),
        listener,
        isSvg
      );
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) {
        break;
      }
      patch(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail],
        newVKids[newTail] = maybeVNode(
          newVKids[newTail--],
          oldVKids[oldTail--]
        ),
        listener,
        isSvg
      );
    }
    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            newVKids[newHead] = maybeVNode(newVKids[newHead++]),
            listener,
            isSvg
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }
      while (newHead <= newTail) {
        oldKey = getKey(oldVKid = oldVKids[oldHead]);
        newKey = getKey(
          newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid)
        );
        if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }
        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                listener,
                isSvg
              );
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                listener,
                isSvg
              );
            }
          }
          newHead++;
        }
      }
      while (oldHead <= oldTail) {
        if (getKey(oldVKid = oldVKids[oldHead++]) == null) {
          node.removeChild(oldVKid.node);
        }
      }
      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }
  return newVNode.node = node;
};
var propsChanged = (a, b) => {
  for (var k in a) if (a[k] !== b[k]) return true;
  for (var k in b) if (a[k] !== b[k]) return true;
};
var maybeVNode = (newVNode, oldVNode) => newVNode !== true && newVNode !== false && newVNode ? typeof newVNode.tag === "function" ? ((!oldVNode || oldVNode.memo == null || propsChanged(oldVNode.memo, newVNode.memo)) && ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo), oldVNode) : newVNode : text("");
var recycleNode = (node) => node.nodeType === TEXT_NODE ? text(node.nodeValue, node) : createVNode(
  node.nodeName.toLowerCase(),
  EMPTY_OBJ,
  map.call(node.childNodes, recycleNode),
  SSR_NODE,
  node
);
var createVNode = (tag, { key, ...props }, children, type, node) => ({
  tag,
  props,
  key,
  children,
  type,
  node
});
var text = (value, node) => createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node);
var h$1 = (tag, { class: c, ...props }, children = EMPTY_ARR) => createVNode(
  tag,
  { ...props, ...c ? { class: createClass(c) } : EMPTY_OBJ },
  isArray(children) ? children : [children]
);
var app = ({
  node,
  view,
  subscriptions,
  dispatch = id,
  init = EMPTY_OBJ
}) => {
  var vdom = node && recycleNode(node);
  var subs = [];
  var state;
  var busy;
  var update = (newState) => {
    if (state !== newState) {
      if ((state = newState) == null) dispatch = subscriptions = render = id;
      if (subscriptions) subs = patchSubs(subs, subscriptions(state), dispatch);
      if (view && !busy) enqueue(render, busy = true);
    }
  };
  var render = () => node = patch(
    node.parentNode,
    node,
    vdom,
    vdom = view(state),
    listener,
    busy = false
  );
  var listener = function(event) {
    dispatch(this.events[event.type], event);
  };
  return (dispatch = dispatch(
    (action, props) => typeof action === "function" ? dispatch(action(state, props)) : isArray(action) ? typeof action[0] === "function" ? dispatch(action[0], action[1]) : action.slice(1).map(
      (fx) => fx && fx !== true && (fx[0] || fx)(dispatch, fx[1]),
      update(action[0])
    ) : update(action)
  ))(init), dispatch;
};
function flattenAll(input, result = []) {
  input.forEach((x) => {
    if (Array.isArray(x)) flattenAll(x, result);
    else result.push(x);
  });
  return result;
}
const h = (type, props, ...children) => typeof type === "function" ? type(props, flattenAll(children)) : h$1(
  type,
  props || {},
  flattenAll(children).map(
    (child) => typeof child === "string" || typeof child === "number" ? text(child) : child
  )
);
const getValue = function(state, keyNames, def) {
  let result = state;
  for (const key of keyNames) {
    if (result == null || typeof result !== "object") return def;
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result = result[key];
    } else {
      return def;
    }
  }
  return result;
};
const setValue = function(state, keyNames, value) {
  let result = { ...state };
  let current = result;
  for (let i = 0; i < keyNames.length; i++) {
    const key = keyNames[i];
    if (Object.prototype.hasOwnProperty.call(current, key) && current[key] != null && typeof current[key] === "object") {
      current[key] = { ...current[key] };
    } else {
      current[key] = {};
    }
    if (keyNames.length - 1 === i) {
      current[key] = value;
    }
    current = current[key];
  }
  return result;
};
const createLocalKey = (id2) => `local_key_${id2}`;
const getLocalState = function(state, id2, def) {
  const localKey = createLocalKey(id2);
  const obj = Object.prototype.hasOwnProperty.call(state, localKey) ? state[localKey] : {};
  return {
    ...def,
    ...obj
  };
};
const setLocalState = function(state, id2, value) {
  const localKey = createLocalKey(id2);
  const obj = Object.prototype.hasOwnProperty.call(state, localKey) ? state[localKey] : {};
  return {
    ...state,
    [localKey]: {
      ...obj,
      ...value
    }
  };
};
const el = (tag) => (props, ...children) => h$1(
  tag,
  props ?? {},
  children.flat().map((child) => typeof child === "object" ? child : text(child))
);
const button = el("button");
const concatAction = function(action, newState, e) {
  if (!action) return newState;
  const effect = (dispatch) => {
    requestAnimationFrame(() => {
      dispatch((state) => action(state, e));
    });
  };
  return [newState, effect];
};
const getClassList = (props) => {
  return props.class ? props.class.trim().split(" ").filter(Boolean) : [];
};
const deleteKeys = (props, ...keys) => {
  const result = { ...props };
  keys.forEach((key) => delete result[key]);
  return result;
};
const Route = function(props, children) {
  const { state, keyNames, match } = props;
  const selectedName = getValue(state, keyNames, "");
  return selectedName === match ? children : null;
};
const REVERSE_PREFIX = "r_";
const SelectButton = function(props, children) {
  const { state, keyNames, id: id2, reverse = false } = props;
  const classList = getClassList(props).filter((item) => {
    const name = item.toLowerCase();
    return name !== "select" && name !== "reverse";
  });
  const selectedNames = getValue(state, keyNames, []);
  if (selectedNames.includes(id2)) classList.push("select");
  if (selectedNames.includes(`${REVERSE_PREFIX}${id2}`)) classList.push("reverse");
  const action = (state2, e) => {
    const selectedNames2 = getValue(state2, keyNames, []);
    const newList = selectedNames2.includes(id2) ? reverse ? selectedNames2.filter((item) => item !== id2).concat(`${REVERSE_PREFIX}${id2}`) : selectedNames2.filter((item) => item !== id2) : selectedNames2.includes(`${REVERSE_PREFIX}${id2}`) ? selectedNames2.filter((item) => item !== `${REVERSE_PREFIX}${id2}`) : selectedNames2.concat(id2);
    const newState = setValue(state2, keyNames, newList);
    return concatAction(props.onclick, newState, e);
  };
  return button({
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
};
const OptionButton = function(props, children) {
  const { state, keyNames, id: id2, reverse = false } = props;
  const classList = getClassList(props).filter((item) => {
    const name = item.toLowerCase();
    return name !== "select" && name !== "reverse";
  });
  const selectedName = getValue(state, keyNames, "");
  if (selectedName === id2) classList.push("select");
  if (selectedName === `${REVERSE_PREFIX}${id2}`) classList.push("reverse");
  const action = (state2, e) => {
    const selectedName2 = getValue(state2, keyNames, "");
    const newValue = selectedName2 === id2 && reverse ? `${REVERSE_PREFIX}${id2}` : id2;
    const newState = setValue(state2, keyNames, newValue);
    return concatAction(props.onclick, newState, e);
  };
  return button({
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
};
const action_throwMessageTick = function(keyNames, id2, text2, interval) {
  const NO_TIMER = 0;
  return (state) => {
    const local = getLocalState(state, id2, {
      timerID: NO_TIMER,
      msg: "",
      index: 0,
      paused: false
    });
    if (local.timerID !== NO_TIMER) clearTimeout(local.timerID);
    if (local.paused) return state;
    const index = text2 === local.msg ? local.index : 0;
    return [
      setValue(state, keyNames, text2.slice(0, index + 1)),
      (dispatch) => {
        dispatch((state2) => setLocalState(state2, id2, {
          timerID: index + 1 < text2.length ? setTimeout(() => {
            dispatch(action_throwMessageTick(
              keyNames,
              id2,
              text2,
              interval
            ));
          }, Math.max(0, interval)) : 0,
          msg: text2,
          index: index + 1
        }));
      }
    ];
  };
};
const effect_throwMessageStart = function(keyNames, id2, text2, interval) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, {
      keyNames,
      msg: "",
      interval,
      index: 0,
      paused: false
    }));
    dispatch(action_throwMessageTick(keyNames, id2, text2, interval));
  };
};
const effect_throwMessagePause = function(id2) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, { paused: true }));
  };
};
const effect_throwMessageResume = function(id2) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, { paused: false }));
    dispatch((state) => {
      const { keyNames, msg, interval } = getLocalState(state, id2, {
        keyNames: [],
        msg: "",
        interval: 0,
        paused: false
      });
      return action_throwMessageTick(keyNames, id2, msg, interval);
    });
  };
};
const _isStart = /* @__PURE__ */ Symbol("RAFTask.isStart");
class RAFTask {
  // field
  #id;
  #groupID;
  #duration;
  #delay;
  #action;
  #finish;
  #priority;
  #extension;
  #startTime;
  #currentTime;
  #pausedTime;
  #paused;
  #deltaTime;
  #isDone;
  // constructor
  constructor(props) {
    this.#id = props.id;
    this.#groupID = props.groupID;
    this.#duration = props.duration;
    this.#delay = props.delay ?? 0;
    this.#action = props.action;
    this.#finish = props.finish;
    this.#priority = props.priority ?? 0;
    this.#extension = props.extension ?? {};
    this.#isDone = false;
    this.#paused = false;
  }
  // getter
  get id() {
    return this.#id;
  }
  get groupID() {
    return this.#groupID;
  }
  get duration() {
    return this.#duration;
  }
  get delay() {
    return this.#delay;
  }
  get action() {
    return this.#action;
  }
  get finish() {
    return this.#finish;
  }
  get priority() {
    return this.#priority;
  }
  get extension() {
    return this.#extension;
  }
  get progress() {
    if (this.#startTime === void 0 || this.#currentTime === void 0) return 0;
    return Math.min(
      1,
      Math.max(
        0,
        (this.#currentTime - this.#startTime) / Math.max(1, this.#duration)
      )
    );
  }
  get deltaTime() {
    return this.#deltaTime ?? 0;
  }
  get isDone() {
    if (this.#isDone) return true;
    if (this.#pausedTime !== void 0) return false;
    return this.progress === 1;
  }
  get paused() {
    return this.#paused;
  }
  // setter
  set groupID(val) {
    this.#groupID = val;
  }
  set priority(val) {
    this.#priority = val;
  }
  set extension(val) {
    this.#extension = val;
  }
  set isDone(val) {
    this.#isDone = val;
  }
  set paused(val) {
    this.#paused = val;
  }
  // private method: _isStart
  /**
   * アクションを開始して良いか判定する
   * 現在時間等のアップデートも同時に行われる
   * subscription_RAFManager でのみ使用される
   * 
   * @param   {number} now - requestAnimatinFrame が返す絶対時間
   * @returns {boolan}     - アクションを実行して良いか判定
   */
  [_isStart](now) {
    if (this.isDone) return false;
    if (this.#startTime === void 0) this.#startTime = now + this.#delay;
    if (this.paused) {
      if (this.#pausedTime === void 0) this.#pausedTime = now;
      this.#deltaTime = 0;
      this.#currentTime = now;
      return false;
    }
    if (!this.paused && this.#pausedTime !== void 0) {
      this.#startTime = this.#startTime + now - this.#pausedTime;
      this.#pausedTime = void 0;
    }
    this.#deltaTime = now < this.#startTime ? 0 : now - (this.#currentTime ?? now);
    this.#currentTime = now;
    this.#isDone = this.progress === 1;
    return !this.#isDone;
  }
  // method: clone
  /**
   * 時間を初期化したクローンを作成して返す
   */
  clone() {
    return new RAFTask({
      id: this.id,
      groupID: this.groupID,
      duration: this.duration,
      delay: this.delay,
      action: this.action,
      finish: this.finish,
      priority: this.priority,
      extension: this.extension
    });
  }
}
const subscription_RAFManager = function(state, keyNames) {
  let rID = 0;
  return [
    (dispatch, payload) => {
      if (payload.length === 0) return () => {
        if (rID !== 0) cancelAnimationFrame(rID);
      };
      const loop = (now) => {
        dispatch((state2) => {
          const tasks = getValue(state2, keyNames, []);
          const newTasks = tasks.map((task) => {
            if (task.isDone) return null;
            if (task[_isStart](now)) {
              requestAnimationFrame(
                () => dispatch((state3) => task.action(state3, task))
              );
            }
            if (task.isDone) {
              const fn = task.finish;
              if (fn) {
                requestAnimationFrame(
                  () => dispatch((state3) => fn(state3, task))
                );
              }
              return null;
            }
            return task;
          }).filter((task) => task !== null);
          if (newTasks.length !== 0) rID = requestAnimationFrame(loop);
          return setValue(state2, keyNames, newTasks);
        });
      };
      rID = requestAnimationFrame(loop);
      return () => {
        if (rID !== 0) cancelAnimationFrame(rID);
      };
    },
    // payload
    getValue(state, keyNames, []).filter((task) => !task.isDone).sort((a, b) => b.priority - a.priority)
  ];
};
const createUnits = function(properties) {
  return properties.map((p) => {
    const selector = Object.keys(p)[0];
    return {
      doms: Array.from(document.querySelectorAll(selector)),
      styles: p[selector]
    };
  });
};
const createRAFProperties = function(props) {
  const { id: id2, groupID, duration, delay, priority, extension, properties } = props;
  const action = (state, rafTask) => {
    const progress = rafTask.progress ?? 0;
    const units = createUnits(properties);
    units.forEach((unit) => {
      for (const [name, fn] of Object.entries(unit.styles)) {
        unit.doms.forEach((dom) => dom.style.setProperty(name, fn(progress)));
      }
    });
    return state;
  };
  const finish = (state, rafTask) => {
    const units = createUnits(properties);
    units.forEach((unit) => {
      unit.doms.forEach((dom) => dom.style.willChange = "");
    });
    return [
      state,
      (dispatch) => {
        const fn = props.finish;
        if (fn) {
          requestAnimationFrame(
            () => requestAnimationFrame(
              () => dispatch((state2) => fn(state2, rafTask))
            )
          );
        }
      }
    ];
  };
  return new RAFTask({
    id: id2,
    groupID,
    duration,
    delay,
    action,
    finish,
    priority,
    extension: {
      ...extension,
      properties
    }
  });
};
const GPU_LAYER = /* @__PURE__ */ new Set(["transform", "opacity"]);
const effect_RAFProperties = function(props) {
  const { id: id2, groupID, duration, delay, finish, priority, extension, properties, keyNames } = props;
  const units = createUnits(properties);
  units.forEach((unit) => {
    const val = [...new Set(Object.keys(unit.styles))].filter((name) => GPU_LAYER.has(name)).join(",");
    unit.doms.forEach((dom) => dom.style.willChange = val);
  });
  const newTask = createRAFProperties({
    id: id2,
    groupID,
    duration,
    delay,
    finish,
    priority,
    extension,
    properties
  });
  return (dispatch) => {
    requestAnimationFrame(() => {
      dispatch((state) => {
        const tasks = getValue(state, keyNames, []).filter((task) => task.id !== id2).concat(newTask);
        return setValue(state, keyNames, tasks);
      });
    });
  };
};
const progress_easing = {
  // basic
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  // cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // quart
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  // back (跳ねる)
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  // bounce
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  // elastic
  easeOutElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};
const createRAFTranslate = function(props) {
  const { id: id2, groupID, duration, delay, priority, translateState } = props;
  const extension = {
    ...props.extension,
    translateState
  };
  const finish = (state, rafTask) => {
    const dom = document.getElementById(id2);
    if (!dom) return state;
    const children = Array.from(dom?.children);
    if (!children || children.length < 2) return state;
    dom.style.transform = "translateX(0px)";
    const firstChild = dom.firstChild;
    if (firstChild) dom.appendChild(firstChild);
    return [
      state,
      (dispatch) => {
        const fn = props.finish;
        if (fn) {
          requestAnimationFrame(() => dispatch((state2) => fn(state2, rafTask)));
        }
      }
    ];
  };
  const properties = [{
    [`#${id2}`]: {
      "transform": (progress) => `translateX(${-translateState.easing(progress) * translateState.width}px)`
    }
  }];
  return createRAFProperties({
    id: id2,
    groupID,
    duration,
    delay,
    finish,
    priority,
    extension,
    properties
  });
};
const effect_translateStart = function(props) {
  const { id: id2, groupID, duration, delay, priority, extension, keyNames } = props;
  const easing = props.easing ? props.easing : (t) => t;
  const finish = (state, rafTask) => {
    const dom = document.getElementById(id2);
    if (!dom) return state;
    const children = Array.from(dom?.children);
    if (!children || children.length < 2) return state;
    const width = children[1].offsetLeft - children[0].offsetLeft;
    const translateState = rafTask.extension?.translateState;
    if (!translateState) return state;
    const newTask = createRAFTranslate({
      id: id2,
      groupID,
      duration,
      delay,
      finish,
      priority,
      extension,
      translateState: {
        index: translateState.index + 1 < children.length ? translateState.index + 1 : 0,
        total: children.length,
        width,
        easing: translateState.easing
      }
    });
    return [
      state,
      (dispatch) => {
        const fn = props.finish;
        if (fn) requestAnimationFrame(() => dispatch((state2) => fn(state2, newTask)));
        const tasks = getValue(state, keyNames, []).filter((task) => task.id !== id2).concat(newTask);
        requestAnimationFrame(() => dispatch((state2) => setValue(state2, keyNames, tasks)));
      }
    ];
  };
  return (dispatch) => {
    const dom = document.getElementById(id2);
    const children = Array.from(dom?.children);
    if (!children || children.length < 2) return;
    const width = children[1].offsetLeft - children[0].offsetLeft;
    const newTask = createRAFTranslate({
      id: id2,
      groupID,
      duration,
      delay,
      finish,
      priority,
      extension,
      translateState: {
        index: 0,
        total: children.length,
        width,
        easing
      }
    });
    dispatch((state) => {
      const tasks = getValue(state, keyNames, []).filter((task) => task.id !== id2).concat(newTask);
      return setValue(state, keyNames, tasks);
    });
  };
};
const effect_translateRollback = function(props) {
  const { id: id2, keyNames, paused } = props;
  return (dispatch) => {
    dispatch((state) => {
      const tasks = getValue(state, keyNames, []);
      const task = tasks.find((task2) => task2.id === id2);
      if (!task) return state;
      const param = task.extension?.translateState;
      if (!param) return state;
      task.paused = true;
      const dom = document.getElementById(id2);
      if (!dom) return state;
      const children = Array.from(dom.children);
      if (!children || children.length < 2) return state;
      const width = (children[1].offsetLeft - children[0].offsetLeft) * param.easing(task.progress);
      const cloneTask = task.clone();
      const newTask = new RAFTask({
        id: `${id2}_remove`,
        duration: 200,
        action: (state2, rafTask) => {
          const val = -width + rafTask.progress * width;
          dom.style.transform = `translateX(${val}px)`;
          return state2;
        },
        finish: (state2, rafTask) => {
          dom.style.transform = "translateX(0px)";
          cloneTask.paused = paused ?? false;
          const fn = props.finish;
          if (fn) {
            requestAnimationFrame(() => dispatch((state3) => fn(state3, cloneTask)));
          }
          return setValue(
            state2,
            keyNames,
            getValue(state2, keyNames, []).filter((task2) => task2.id !== id2 && task2.id !== `${id2}_remove`).concat(cloneTask)
          );
        }
      });
      return setValue(
        state,
        keyNames,
        tasks.filter((task2) => task2.id !== id2).concat(newTask)
      );
    });
  };
};
const effect_translateRollforward = function(props) {
  const { id: id2, keyNames, paused } = props;
  return (dispatch) => {
    dispatch((state) => {
      const tasks = getValue(state, keyNames, []);
      const task = tasks.find((task2) => task2.id === id2);
      if (!task) return state;
      const param = task.extension?.translateState;
      if (!param) return state;
      task.paused = true;
      const dom = document.getElementById(id2);
      if (!dom) return state;
      const children = Array.from(dom.children);
      if (!children || children.length < 2) return state;
      const maxWidth = children[1].offsetLeft - children[0].offsetLeft;
      const width = maxWidth * param.easing(task.progress);
      const cloneTask = task.clone();
      const newTask = new RAFTask({
        id: `${id2}_remove`,
        duration: 200,
        action: (state2, rafTask) => {
          const val = -width - rafTask.progress * (maxWidth - width);
          dom.style.transform = `translateX(${val}px)`;
          return state2;
        },
        finish: (state2, rafTask) => {
          cloneTask.paused = paused ?? false;
          const propsFn = props.finish;
          if (propsFn) {
            requestAnimationFrame(() => dispatch((state3) => propsFn(state3, cloneTask)));
          }
          const cloneFn = cloneTask.finish;
          if (cloneFn) {
            requestAnimationFrame(() => dispatch((state3) => cloneFn(state3, cloneTask)));
          }
          return setValue(
            state2,
            keyNames,
            getValue(state2, keyNames, []).filter((task2) => task2.id !== id2 && task2.id !== `${id2}_remove`).concat(cloneTask)
          );
        }
      });
      return setValue(
        state,
        keyNames,
        tasks.filter((task2) => task2.id !== id2).concat(newTask)
      );
    });
  };
};
const effect_translateSlide = function(props) {
  const { id: id2, keyNames, index, paused, finish } = props;
  return (dispatch) => {
    const dom = document.getElementById(id2);
    if (!dom) return;
    const children = Array.from(dom.children);
    if (!children || children.length < index || children.length < 2) return;
    dispatch((state) => {
      const tasks = getValue(state, keyNames, []);
      const task = tasks.find((task2) => task2.id === id2);
      if (!task) return state;
      const param = task.extension?.translateState;
      if (!param) return state;
      const moveTo = index - param.index;
      if (moveTo === 0) {
        return [state, effect_translateRollback({
          id: id2,
          keyNames,
          paused,
          finish
        })];
      }
      task.paused = true;
      const cloneTask = task.clone();
      const maxWidth = children[1].offsetLeft - children[0].offsetLeft;
      const width = param.easing(task.progress) * maxWidth;
      const cloneNodes = [];
      let newTask;
      if (moveTo > 0) {
        for (let i = 0; i < moveTo - 1; i++) {
          const cloneNode = children[i].cloneNode(true);
          cloneNodes.push(cloneNode);
          dom.appendChild(cloneNode);
        }
        const reWidth = dom.children[moveTo].offsetLeft - children[0].offsetLeft - width;
        newTask = new RAFTask({
          id: `${id2}_slide`,
          duration: 200,
          action: (state2, rafTask) => {
            const val = -width - rafTask.progress * reWidth;
            dom.style.transform = `translateX(${val}px)`;
            return state2;
          },
          finish: (state2, rafTask) => {
            cloneTask.paused = paused ?? false;
            cloneNodes.forEach((node) => node.remove());
            for (let i = 0; i < moveTo - 1; i++) {
              const firstChild = dom.firstChild;
              if (firstChild) dom.appendChild(firstChild);
            }
            cloneTask.extension.translateState.index = index === 0 ? cloneTask.extension.translateState.total : index - 1;
            const propsFn = props.finish;
            if (propsFn) {
              requestAnimationFrame(() => dispatch((state3) => propsFn(state3, cloneTask)));
            }
            const cloneFn = cloneTask.finish;
            if (cloneFn) {
              requestAnimationFrame(() => dispatch((state3) => cloneFn(state3, cloneTask)));
            }
            return setValue(
              state2,
              keyNames,
              getValue(state2, keyNames, []).filter((task2) => task2.id !== id2 && task2.id !== `${id2}_slide`).concat(cloneTask)
            );
          }
        });
      } else {
        const need = Math.abs(moveTo);
        for (let i = 0; i < need + 1; i++) {
          const cloneNode = children[children.length - 1 - i].cloneNode(true);
          cloneNodes.push(cloneNode);
          dom.insertBefore(cloneNode, dom.firstChild);
        }
        const reWidth = dom.children[need].offsetLeft - dom.children[0].offsetLeft + width;
        dom.style.transform = `translateX(${-reWidth}px)`;
        newTask = new RAFTask({
          id: `${id2}_slide`,
          duration: 200,
          action: (state2, rafTask) => {
            const val = -width + rafTask.progress * reWidth;
            dom.style.transform = `translateX(${val}px)`;
            return state2;
          },
          finish: (state2, rafTask) => {
            cloneTask.paused = paused ?? false;
            cloneNodes.forEach((node) => node.remove());
            for (let i = 0; i < need + 1; i++) {
              const lastChild = dom.children[dom.children.length - 1];
              if (lastChild) dom.insertBefore(lastChild, dom.firstChild);
            }
            cloneTask.extension.translateState.index = index === 0 ? cloneTask.extension.translateState.total : index - 1;
            const propsFn = props.finish;
            if (propsFn) {
              requestAnimationFrame(() => dispatch((state3) => propsFn(state3, cloneTask)));
            }
            const cloneFn = cloneTask.finish;
            if (cloneFn) {
              requestAnimationFrame(() => dispatch((state3) => cloneFn(state3, cloneTask)));
            }
            return setValue(
              state2,
              keyNames,
              getValue(state2, keyNames, []).filter((task2) => task2.id !== id2 && task2.id !== `${id2}_slide`).concat(cloneTask)
            );
          }
        });
      }
      return setValue(
        state,
        keyNames,
        tasks.filter((task2) => task2.id !== id2).concat(newTask)
      );
    });
  };
};
const getScrollMargin = function(e) {
  const el2 = e.currentTarget;
  if (!el2) return { top: 0, left: 0, right: 0, bottom: 0 };
  return {
    top: el2.scrollTop,
    left: el2.scrollLeft,
    right: el2.scrollWidth - (el2.clientWidth + el2.scrollLeft),
    bottom: el2.scrollHeight - (el2.clientHeight + el2.scrollTop)
  };
};
const marquee = function(props) {
  const { element, duration, interval, easing = (t) => t } = props;
  const calcWidth = () => {
    const children = Array.from(element.children);
    return !children || children.length < 2 ? 0 : children[1].offsetLeft - children[0].offsetLeft;
  };
  let rID = 0;
  let timerID = 0;
  let startTime = 0;
  let width = 0;
  const action = (now) => {
    if (startTime === 0) startTime = now;
    const progress = Math.min((now - startTime) / Math.max(1, duration));
    element.style.transform = `translateX(${-easing(progress) * width}px)`;
    if (progress < 1) {
      rID = requestAnimationFrame(action);
      return;
    }
    element.style.transform = `translateX(0px)`;
    const firstChild = element.children[0];
    if (!firstChild) return;
    element.appendChild(firstChild);
    timerID = window.setTimeout(() => {
      startTime = 0;
      rID = requestAnimationFrame(action);
    }, interval);
  };
  return {
    start: () => {
      if (rID !== 0) return;
      width = calcWidth();
      if (width === 0) return;
      element.style.willChange = "transform";
      rID = requestAnimationFrame(action);
    },
    stop: () => {
      cancelAnimationFrame(rID);
      clearTimeout(timerID);
      element.style.willChange = "";
      element.style.transform = "";
      rID = 0;
      timerID = 0;
    }
  };
};
const effect_setTimedValue = function(keyNames, id2, timeout, value, reset = null) {
  const NO_TIMER = 0;
  return (dispatch) => {
    dispatch((state) => {
      const { timerID } = getLocalState(state, id2, { timerID: NO_TIMER });
      if (timerID !== NO_TIMER) clearTimeout(timerID);
      return setLocalState(
        setValue(state, keyNames, value),
        id2,
        {
          timerID: setTimeout(() => {
            dispatch((state2) => setLocalState(
              setValue(state2, keyNames, reset),
              id2,
              {
                timerID: NO_TIMER
              }
            ));
          }, Math.max(0, timeout))
        }
      );
    });
  };
};
const effect_nodesInitialize = function(nodes) {
  const done = /* @__PURE__ */ new Set();
  return (dispatch) => {
    nodes.forEach((node) => {
      if (done.has(node.id)) return;
      done.add(node.id);
      const element = document.getElementById(node.id);
      if (element) dispatch([node.event, element]);
    });
  };
};
const subscription_nodesCleanup = function(nodes) {
  const key = `local_key_nodesCleanup`;
  return nodes.map((node) => [
    (dispatch, payload) => {
      dispatch((state) => {
        const dom = document.getElementById(payload.id);
        const keys = [key, payload.id, "initialized"];
        const initialized = getValue(state, keys, false);
        if (dom && !initialized) {
          return setValue(state, keys, true);
        }
        if (!dom && initialized) {
          const newState = setValue(state, keys, false);
          return payload.finalize(newState);
        }
        return state;
      });
      return () => {
      };
    },
    node
  ]);
};
const div = el("div");
const ul = el("ul");
const li = el("li");
const Carousel = function(props, children) {
  const { state, id: id2, keyNames, controlButton, controlBar } = props;
  const task = getValue(state, keyNames, []).find((task2) => task2.id === id2);
  const carouselState = task?.extension?.carouselState;
  const controller = task?.extension.carouselController;
  const index = carouselState?.reportPageIndex ? getValue(state, carouselState.reportPageIndex, 0) : getLocalState(state, id2, { index: 0 }).index;
  const items = Array.isArray(children) ? children : [children];
  const action_mouseenter = (state2) => {
    const rafTask = getValue(state2, keyNames, []).find((task2) => task2.id === id2);
    if (!rafTask) return state2;
    if (rafTask.progress < 0.4) {
      controller.rollBack(rafTask);
    } else {
      controller.rollForward(rafTask);
    }
    return state2;
  };
  const action_mouseleave = (state2) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    task2.paused = false;
    return state2;
  };
  const action_controlBarClick = (state2, index2) => {
    const rafTask = getValue(state2, keyNames, []).find((task2) => task2.id === id2);
    if (!rafTask) return state2;
    controller.step(rafTask, index2);
    return state2;
  };
  return div(
    {
      ...deleteKeys(props, "state", "keyNames")
    },
    ul(
      {
        onmouseenter: action_mouseenter,
        onmouseleave: action_mouseleave
      },
      items.map((item) => li({}, item))
    ),
    controlBar && div(
      {},
      ul(
        {},
        items.map((item, i) => li({
          class: i === index && "select",
          onclick: [action_controlBarClick, i]
        }, "○"))
      )
    )
  );
};
const effect_InitCarousel = function(keyNames, carouselState) {
  const SKIP_SPEED = 200;
  const id2 = carouselState.id;
  return (dispatch) => {
    const div2 = document.getElementById(id2);
    if (!div2) return;
    const ul2 = div2.children[0];
    if (!ul2) return;
    const children = Array.from(ul2.children).filter((child) => {
      if (child.classList.contains("carousel_clone")) {
        child.remove();
        return false;
      }
      return true;
    });
    if (!children || children.length === 0) return;
    const widths = [];
    for (let i = 0; i < children.length; i++) {
      widths[i] = children[i].getBoundingClientRect().width;
    }
    const carouselPrivateState = {
      ul: ul2,
      index: 0,
      step: 0,
      startOffset: 0,
      targetOffset: 0,
      currentOffset: 0,
      cloneNodes: []
    };
    const reverseLookup = (index) => {
      const leftIndex = carouselPrivateState.index;
      return ((index - leftIndex) % children.length + children.length) % children.length;
    };
    const getMoveSize = () => {
      let result = 0;
      for (let i = 0; i < Math.abs(carouselPrivateState.step); i++) {
        const index = carouselPrivateState.step < 0 ? children.length - 1 - i % children.length : i % children.length;
        result += widths[reverseLookup(index)];
      }
      return result;
    };
    const getCloneCount = () => {
      let size = 0;
      const safeMargin = 1;
      const moveSize = getMoveSize() + safeMargin;
      let i = 0;
      while (size < moveSize - safeMargin) {
        const index = carouselPrivateState.step < 0 ? children.length - 1 - i % children.length : i % children.length;
        size += widths[reverseLookup(index)];
        i = i + 1;
      }
      return i;
    };
    const addClones = (count) => {
      for (let i = 0; i < count; i++) {
        const index = carouselPrivateState.step < 0 ? children.length - 1 - i % children.length + i : i % children.length;
        const child = ul2.children[index];
        if (child) {
          const clone = child.cloneNode(true);
          if (carouselPrivateState.step < 0) {
            ul2.insertBefore(clone, ul2.firstChild);
          } else {
            ul2.appendChild(clone);
          }
          clone.classList.add("carousel_clone");
          carouselPrivateState.cloneNodes.push(clone);
        }
      }
    };
    const carouselController = {
      // ---------- ---------- ----------
      // step
      // ---------- ---------- ----------
      step: (rafTask, delta) => {
        return new Promise((resolve, reject) => {
          const carouselState2 = rafTask.extension?.carouselState;
          if (!carouselState2) return reject();
          if (!carouselPrivateState.ul.isConnected) {
            rafTask.isDone = true;
            return reject();
          }
          rafTask.paused;
          rafTask.paused = true;
          const getCurrentPosition = () => {
            let index = -1;
            let absolute = -1;
            const border = Math.abs(carouselPrivateState.currentOffset);
            const items = carouselPrivateState.ul.children;
            for (let i = 0, size = 0; i < items.length; i++) {
              size += items[i].getBoundingClientRect().width;
              if (size >= border) {
                index = i;
                break;
              }
            }
            if (index === -1) return null;
            const baseIndex = ((carouselPrivateState.index - carouselPrivateState.step) % children.length + children.length) % children.length;
            absolute = ((baseIndex - (carouselPrivateState.step < 0 ? children.length - 1 - index : -index)) % children.length + children.length) % children.length;
            return {
              absoluteIndex: absolute,
              relativeIndex: index
            };
          };
          const currentPosition = getCurrentPosition();
          if (!currentPosition) return reject();
          const stepTo = currentPosition.relativeIndex + (delta - currentPosition.absoluteIndex);
          const targetOffset = -carouselPrivateState.ul.children[stepTo].offsetLeft;
          carouselPrivateState.startOffset = carouselPrivateState.currentOffset;
          carouselPrivateState.index = currentPosition.absoluteIndex;
          carouselPrivateState.targetOffset = targetOffset;
          const cloneTask = rafTask.clone();
          const action2 = (state, rafTask2) => {
            const val = carouselPrivateState.startOffset + (carouselPrivateState.targetOffset - carouselPrivateState.startOffset) * rafTask2.progress;
            carouselPrivateState.ul.style.transform = `translateX(${val}px)`;
            carouselPrivateState.currentOffset = val;
            return state;
          };
          const finish2 = (state, rafTask2) => {
            let newState = state;
            alert("finish");
            if (carouselState2.reportPageIndex) {
              newState = setValue(
                newState,
                carouselState2.reportPageIndex,
                delta - currentPosition.absoluteIndex
                // 仮
              );
            } else {
              newState = setLocalState(
                newState,
                id2,
                { index: delta - currentPosition.absoluteIndex }
                // 仮
              );
            }
            const tasks = getValue(state, keyNames, []).filter((task) => task.id !== `${task.id}_step`).concat(cloneTask);
            return [
              setValue(newState, keyNames, tasks),
              (dispatch2) => {
                const fn = cloneTask.finish;
                if (fn) {
                  requestAnimationFrame(() => dispatch2((state2) => [fn, cloneTask]));
                }
                resolve(cloneTask);
              }
            ];
          };
          const newTask = new RAFTask({
            id: `${rafTask.id}_step`,
            duration: 2e3,
            action: action2,
            finish: finish2
          });
          requestAnimationFrame(() => {
            dispatch((state) => {
              const tasks = getValue(state, keyNames, []).filter((task) => task.id !== id2).concat(newTask);
              return setValue(state, keyNames, tasks);
            });
          });
        });
      },
      // end CarouselController.step
      // ---------- ---------- ----------
      // rollBack
      // ---------- ---------- ----------
      rollBack: (rafTask) => {
        return new Promise((resolve, reject) => {
          if (rafTask.progress === 0) return reject();
          const paused = rafTask.paused;
          rafTask.paused = true;
          const carouselState2 = rafTask.extension?.carouselState;
          if (!carouselState2) return reject();
          if (!carouselPrivateState.ul.isConnected) {
            rafTask.isDone = true;
            return reject();
          }
          const cloneTask = rafTask.clone();
          const newTask = new RAFTask({
            id: `${rafTask.id}_rollBack`,
            duration: SKIP_SPEED,
            delay: 0,
            // action
            action: (state, rafTask2) => {
              const val = carouselPrivateState.currentOffset + (carouselPrivateState.startOffset - carouselPrivateState.currentOffset) * rafTask2.progress;
              carouselPrivateState.currentOffset = val;
              carouselPrivateState.ul.style.transform = `translateX(${val}px)`;
              return state;
            },
            // finish
            finish: (state, rafTask2) => {
              cloneTask.paused = paused;
              const tasks = getValue(state, keyNames, []).filter((task) => task.id !== rafTask2.id).concat(cloneTask);
              return [
                setValue(state, keyNames, tasks),
                (dispatch2) => {
                  resolve(cloneTask);
                }
              ];
            }
          });
          requestAnimationFrame(() => {
            dispatch((state) => {
              const tasks = getValue(state, keyNames, []).filter((task) => task.id !== rafTask.id).concat(newTask);
              return setValue(state, keyNames, tasks);
            });
          });
        });
      },
      // end CarouselController.rollBack
      // ---------- ---------- ----------
      // rollForward
      // ---------- ---------- ----------
      rollForward: (rafTask) => {
        return new Promise((resolve, reject) => {
          const paused = rafTask.paused;
          rafTask.paused = true;
          const carouselState2 = rafTask.extension?.carouselState;
          if (!carouselState2) return reject();
          if (!carouselPrivateState.ul.isConnected) {
            rafTask.isDone = true;
            return reject();
          }
          const cloneTask = rafTask.clone();
          const newTask = new RAFTask({
            id: `${rafTask.id}_rollForward`,
            duration: SKIP_SPEED,
            delay: 0,
            // action
            action: (state, rafTask2) => {
              const val = carouselPrivateState.currentOffset + (carouselPrivateState.targetOffset - carouselPrivateState.currentOffset) * rafTask2.progress;
              carouselPrivateState.currentOffset = val;
              carouselPrivateState.ul.style.transform = `translateX(${val}px)`;
              return state;
            },
            // finish
            finish: (state, rafTask2) => {
              cloneTask.paused = paused;
              const tasks = getValue(state, keyNames, []).filter((task) => task.id !== rafTask2.id).concat(cloneTask);
              return [
                setValue(state, keyNames, tasks),
                (dispatch2) => {
                  const fn = cloneTask.finish;
                  if (fn) {
                    requestAnimationFrame(() => dispatch2((state2) => [fn, cloneTask]));
                  }
                  resolve(cloneTask);
                }
              ];
            }
          });
          requestAnimationFrame(() => {
            dispatch((state) => {
              const tasks = getValue(state, keyNames, []).filter((task) => task.id !== rafTask.id).concat(newTask);
              return setValue(state, keyNames, tasks);
            });
          });
        });
      }
      // end rollForward
    };
    const action = (state, rafTask) => {
      const carouselState2 = rafTask.extension?.carouselState;
      if (!carouselState2) return state;
      const easing = carouselState2.easing ?? ((t) => t);
      if (!carouselPrivateState.ul.isConnected) {
        rafTask.isDone = true;
        return state;
      }
      if (rafTask.paused) return state;
      if (carouselPrivateState.step === 0) return state;
      if (carouselPrivateState.cloneNodes.length === 0) {
        carouselPrivateState.cloneNodes.forEach((node) => node.remove());
        carouselPrivateState.cloneNodes = [];
        addClones(getCloneCount());
        const nodeA = ul2.children[0];
        const nodeB = ul2.children[Math.abs(carouselPrivateState.step)];
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();
        carouselPrivateState.startOffset = carouselPrivateState.step < 0 ? rectA.left - rectB.left : 0;
        carouselPrivateState.targetOffset = carouselPrivateState.step < 0 ? 0 : rectA.left - rectB.left;
      }
      carouselPrivateState.currentOffset = carouselPrivateState.startOffset + (carouselPrivateState.targetOffset - carouselPrivateState.startOffset) * easing(rafTask.progress);
      ul2.style.transform = `translateX(${carouselPrivateState.currentOffset}px)`;
      return [state, (dispatch2) => {
        const fn = carouselState2.action;
        if (fn) {
          requestAnimationFrame(() => dispatch2((state2) => [fn, rafTask]));
        }
      }];
    };
    const finish = (state, rafTask) => {
      const carouselState2 = rafTask.extension?.carouselState;
      if (!carouselState2) return state;
      if (!carouselPrivateState.ul.isConnected) {
        rafTask.isDone = true;
        return state;
      }
      if (rafTask.paused) return state;
      carouselPrivateState.cloneNodes.forEach((node) => node.remove());
      carouselPrivateState.cloneNodes = [];
      for (let i = 0; i < Math.abs(carouselPrivateState.step); i++) {
        if (carouselPrivateState.step < 0) {
          const child = ul2.lastChild;
          if (child) ul2.insertBefore(child, ul2.firstChild);
        } else {
          const child = ul2.firstChild;
          if (child) ul2.appendChild(child);
        }
      }
      ul2.style.transform = "translateX(0px)";
      ul2.style.willChange = "";
      const length = carouselPrivateState.ul.children.length;
      const index = carouselPrivateState.index;
      const step = carouselState2.step;
      carouselPrivateState.index = ((index + step) % length + length) % length;
      carouselPrivateState.step = carouselState2.step;
      carouselPrivateState.startOffset = 0;
      carouselPrivateState.targetOffset = 0;
      const newTask = new RAFTask({
        id: id2,
        groupID: carouselState2.groupID,
        duration: carouselState2.duration ?? 1e3,
        delay: carouselState2.delay ?? 2e3,
        action,
        finish,
        priority: carouselState2.priority ?? 0,
        extension: {
          ...carouselState2.extension,
          carouselState: carouselState2,
          carouselController
        }
      });
      const tasks = getValue(state, keyNames, []).filter((task) => task.id !== carouselState2.id);
      let newState = setValue(state, keyNames, tasks.concat(newTask));
      if (carouselState2.reportPageIndex) {
        newState = setValue(
          newState,
          carouselState2.reportPageIndex,
          ((carouselPrivateState.index - step) % children.length + children.length) % children.length
        );
      } else {
        newState = setLocalState(
          newState,
          id2,
          {
            index: ((carouselPrivateState.index - step) % children.length + children.length) % children.length
          }
        );
      }
      return [newState, (dispatch2) => {
        const fn = carouselState2.finish;
        if (fn) {
          requestAnimationFrame(() => dispatch2((state2) => [fn, rafTask]));
        }
      }];
    };
    ul2.style.willChange = "transform";
    dispatch((state) => {
      const tasks = getValue(state, keyNames, []).filter((task2) => task2.id !== carouselState.id);
      const task = new RAFTask({
        id: carouselState.id,
        groupID: carouselState.groupID,
        duration: 0,
        delay: 0,
        action: (state2, rafTask) => state2,
        finish,
        priority: carouselState.priority ?? 0,
        extension: {
          ...carouselState.extension,
          carouselState,
          carouselController
        }
      });
      return setValue(state, keyNames, tasks.concat(task));
    });
  };
};
const action_effectButtonClick = (state) => {
  const label = /* @__PURE__ */ h("label", null, "Label");
  const text2 = Array.from({ length: 40 }).map((_, i) => i).join("");
  return [
    state,
    effect_nodesInitialize([
      {
        id: "initTest",
        event: (state2, element) => {
          const input = element;
          input.value = `initTest: width = ${input.clientWidth}, height = ${input.clientHeight}`;
          return state2;
        }
      }
    ]),
    effect_setTimedValue(["effect", "timedText"], "timedText", 2e3, "timedText", ""),
    effect_setTimedValue(["effect", "node"], "label1", 2e3, label, null),
    effect_throwMessageStart(["effect", "throwMsg"], "msg", text2, 50)
  ];
};
const action_throwAction = (state) => {
  return { ...state };
};
const action_toggleFinalize = (state) => {
  return setValue(state, ["subscriptions", "finalize"], !state.subscriptions.finalize);
};
const action_move = (state) => {
  const effect = effect_RAFProperties({
    id: "raf",
    keyNames: ["subscriptions", "tasks"],
    duration: 1e3,
    properties: [{
      ["#raf"]: {
        "transform": (progress) => {
          const fn = progress_easing[state.effect.easing];
          return `translate(${fn(progress) * 10}rem, 0)`;
        }
      }
    }],
    finish: (state2, rafTask) => {
      const dom = document.getElementById(rafTask.id);
      if (!dom) return state2;
      setTimeout(() => {
        dom.style.transform = "translate(0, 0)";
      }, 1e3);
      return state2;
    }
  });
  return [state, effect];
};
const action_setEasing = (state, e) => {
  const element = e.currentTarget;
  return setValue(state, ["effect", "easing"], element.value);
};
const action_setProperties = (state) => {
  const effect = effect_RAFProperties({
    id: "rafP",
    duration: 1e3,
    properties: [{
      "#rafP": {
        "font-size": (progress) => `${1 + progress * 3}rem`,
        "margin": (progress) => `0.5rem 0 0.5rem ${2 + progress * 5}rem`
      }
    }],
    finish: (state2, rafTask) => {
      const dom = document.getElementById(rafTask.id);
      if (!dom) return state2;
      setTimeout(() => {
        dom.style.fontSize = "1rem";
        dom.style.margin = "0.5rem 0 0.5rem 2rem";
      }, 1e3);
      return state2;
    },
    keyNames: ["subscriptions", "tasks"]
  });
  return [state, effect];
};
const action_scroll = (state, e) => {
  return setValue(state, ["dom", "margin"], getScrollMargin(e));
};
let controls = null;
const action_translateButtonClick = (state) => {
  if (controls) controls.stop();
  const effect_setMarquee = (dispatch) => {
    dispatch((state2) => {
      const ul2 = document.getElementById("marquee");
      if (!ul2) return state2;
      controls = marquee({
        element: ul2,
        duration: 2e3,
        interval: 1e3,
        easing: progress_easing.easeOutCubic
      });
      setTimeout(() => controls?.start(), 1e3);
      return state2;
    });
  };
  const translate_finish = (state2, rafTask) => {
    const translateState = rafTask.extension?.translateState;
    if (!translateState) return state2;
    return setValue(state2, ["translate", "index"], translateState.index);
  };
  return [
    state,
    effect_setMarquee,
    effect_translateStart({
      id: "translate",
      duration: 2e3,
      delay: 1e3,
      finish: translate_finish,
      easing: progress_easing.easeOutCubic,
      keyNames: ["subscriptions", "tasks"]
    })
  ];
};
let isMouseOver = false;
const action_translatePause = (state) => {
  isMouseOver = true;
  const id2 = "translate";
  const keyNames = ["subscriptions", "tasks"];
  const task = getValue(state, keyNames, []).find((task2) => task2.id === id2);
  if (!task) return state;
  const effect = task.progress < 0.2 ? effect_translateRollback : effect_translateRollforward;
  return [
    state,
    effect({
      id: id2,
      keyNames,
      paused: false,
      finish: (state2, rafTask) => {
        rafTask.paused = isMouseOver;
        return state2;
      }
    })
  ];
};
const action_translateResume = (state) => {
  isMouseOver = false;
  const task = getValue(state, ["subscriptions", "tasks"], []).find((task2) => task2.id === "translate");
  if (task) task.paused = false;
  return state;
};
const action_translateSlide = (state, index) => {
  const id2 = "translate";
  const keyNames = ["subscriptions", "tasks"];
  return [
    state,
    effect_translateSlide({ id: id2, keyNames, index })
  ];
};
const action_carouselButtonClick = (state) => {
  const keyNames = ["subscriptions", "tasks"];
  const param = {
    id: "carousel",
    duration: 5e3,
    step: 2,
    easing: progress_easing.easeInOutCubic
  };
  return [state, (dispatch) => {
    requestAnimationFrame(
      () => requestAnimationFrame(
        () => dispatch((state2) => [state2, effect_InitCarousel(keyNames, param)])
      )
    );
  }];
};
addEventListener("load", () => {
  const easingList = (() => {
    const r = [];
    for (const p in progress_easing) {
      r.push(p);
    }
    return r;
  })();
  const param = {
    debug: "init...",
    tabName: "",
    selectButton: {
      selected: []
    },
    optionButton: {
      group1: "",
      group2: ""
    },
    effect: {
      timedText: "",
      throwMsg: "",
      node: null,
      easing: "linear"
    },
    subscriptions: {
      finalize: false,
      tasks: []
    },
    dom: {
      margin: { top: 0, left: 0, right: 0, bottom: 0 }
    },
    translate: {
      index: 0
    }
  };
  app({
    node: document.getElementById("app"),
    init: param,
    view: (state) => /* @__PURE__ */ h("main", null, /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(OptionButton, { state, keyNames: ["tabName"], id: "page1" }, "SelectButton"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["tabName"], id: "page2" }, "OptionButton"), /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        keyNames: ["tabName"],
        id: "page3",
        onclick: action_effectButtonClick
      },
      "Effect"
    ), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["tabName"], id: "page4" }, "Subscriptions"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["tabName"], id: "page5" }, "DOM / Event"), /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        keyNames: ["tabName"],
        id: "page6",
        onclick: action_translateButtonClick
      },
      "Translate"
    ), /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        keyNames: ["tabName"],
        id: "page7",
        onclick: action_carouselButtonClick
      },
      "Carousel Component"
    )), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page1" }, /* @__PURE__ */ h("h2", null, "SelectButton example"), /* @__PURE__ */ h("h3", null, "select / none"), /* @__PURE__ */ h(SelectButton, { state, keyNames: ["selectButton", "selected"], id: "btn1" }, "select / none"), /* @__PURE__ */ h("h3", null, "select / reverse / none"), /* @__PURE__ */ h(SelectButton, { state, keyNames: ["selectButton", "selected"], id: "btn2", reverse: true }, "select / reverse / none")), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page2" }, /* @__PURE__ */ h("h2", null, "OptionButton example"), /* @__PURE__ */ h("h3", null, "select"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group1"], id: "g1_btn1" }, "group1_btn1"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group1"], id: "g1_btn2" }, "group1_btn2"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group1"], id: "g1_btn3" }, "group1_btn3"), /* @__PURE__ */ h("h3", null, "select / reverse"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group2"], id: "g2_btn1", reverse: true }, "group2_btn1"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group2"], id: "g2_btn2", reverse: true }, "group2_btn2"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["optionButton", "group2"], id: "g2_btn3", reverse: true }, "group2_btn3")), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page3" }, /* @__PURE__ */ h("h2", null, "Effect example"), /* @__PURE__ */ h("h3", null, "effect_initializeNodes"), /* @__PURE__ */ h("input", { type: "text", id: "initTest" }), /* @__PURE__ */ h("h3", null, "effect_setTimedValue"), /* @__PURE__ */ h("input", { type: "text", id: "timedText", value: state.effect.timedText }), state.effect.node, /* @__PURE__ */ h("h3", null, "effect_throwMessage"), /* @__PURE__ */ h("input", { type: "text", id: "msg", value: state.effect.throwMsg }), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(
      "button",
      {
        type: "button",
        onclick: (state2) => [state2, effect_throwMessagePause("msg")]
      },
      "pause"
    ), /* @__PURE__ */ h(
      "button",
      {
        type: "button",
        onclick: (state2) => [state2, effect_throwMessageResume("msg")]
      },
      "resume"
    )), /* @__PURE__ */ h("h2", null, "rAF / Animation System"), /* @__PURE__ */ h("h3", null, "effect_rAFProperties - transform"), /* @__PURE__ */ h("button", { state, onclick: action_move, id: "raf" }, state.effect.easing), /* @__PURE__ */ h("br", null), /* @__PURE__ */ h("select", { onchange: action_setEasing }, easingList.map((p) => /* @__PURE__ */ h("option", null, p))), /* @__PURE__ */ h("h3", null, "effect_rAFProperties - font-size"), /* @__PURE__ */ h("button", { state, onclick: action_setProperties, id: "rafP" }, "font")), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page4" }, /* @__PURE__ */ h("h2", null, "Subscriptions example"), /* @__PURE__ */ h("h2", null, "subscription_nodesCleanup"), /* @__PURE__ */ h("button", { type: "button", onclick: action_throwAction }, "throw action"), /* @__PURE__ */ h("button", { type: "button", onclick: action_toggleFinalize }, "toggle object"), state.subscriptions.finalize ? /* @__PURE__ */ h("span", { id: "dom" }, "object") : null), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page5" }, /* @__PURE__ */ h("h2", null, "DOM / Event example"), /* @__PURE__ */ h("h3", null, "getScrollMargin"), /* @__PURE__ */ h("div", { id: "parent", onscroll: action_scroll }, /* @__PURE__ */ h("div", { id: "child" }, "スクロールしてください")), /* @__PURE__ */ h("div", null, JSON.stringify(state.dom.margin))), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page6" }, /* @__PURE__ */ h("h2", null, "Translate"), /* @__PURE__ */ h(
      "ul",
      {
        id: "translate",
        onmouseenter: action_translatePause,
        onmouseleave: action_translateResume
      },
      Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ h("li", null, i))
    ), /* @__PURE__ */ h(
      "div",
      {
        id: "translateBar"
      },
      /* @__PURE__ */ h("div", { title: "jump index" }, Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ h(
        "div",
        {
          class: i === state.translate.index && "select",
          onclick: [action_translateSlide, i]
        },
        i
      )))
    ), /* @__PURE__ */ h("h2", null, "marquee"), /* @__PURE__ */ h("ul", { id: "marquee" }, Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ h("li", null, i)))), /* @__PURE__ */ h(Route, { state, keyNames: ["tabName"], match: "page7" }, /* @__PURE__ */ h("h2", null, "Carousel Component"), /* @__PURE__ */ h(
      Carousel,
      {
        state,
        id: "carousel",
        class: "carousel",
        keyNames: ["subscriptions", "tasks"],
        controlBar: true
      },
      /* @__PURE__ */ h("img", { id: "item1", src: "sample-image/image1.webp" }),
      /* @__PURE__ */ h("img", { id: "item2", src: "sample-image/image2.webp" }),
      /* @__PURE__ */ h("img", { id: "item3", src: "sample-image/image3.webp" })
    )))),
    subscriptions: (state) => [
      ...subscription_nodesCleanup([{
        id: "dom",
        finalize: (state2) => {
          alert("finalize");
          return state2;
        }
      }]),
      subscription_RAFManager(state, ["subscriptions", "tasks"])
    ]
  });
});
