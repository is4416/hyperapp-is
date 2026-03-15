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
    for (var k2 = 0, tmp; k2 < obj.length; k2++) {
      if (tmp = createClass(obj[k2])) {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k2 in obj) {
      if (obj[k2]) out += (out && " ") + k2;
    }
  }
  return out;
};
var shouldRestart = (a, b2) => {
  for (var k2 in { ...a, ...b2 }) {
    if (typeof (isArray(a[k2]) ? a[k2][0] : a[k2]) === "function") {
      b2[k2] = a[k2];
    } else if (a[k2] !== b2[k2]) return true;
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
    for (var k2 in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k2] == null ? "" : newValue[k2];
      if (k2[0] === "-") {
        node[key].setProperty(k2, oldValue);
      } else {
        node[key][k2] = oldValue;
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
  for (var k2 in props) {
    patchProperty(node, k2, null, props[k2], listener, isSvg);
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
var propsChanged = (a, b2) => {
  for (var k2 in a) if (a[k2] !== b2[k2]) return true;
  for (var k2 in b2) if (a[k2] !== b2[k2]) return true;
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
  input.forEach((x2) => {
    if (Array.isArray(x2)) flattenAll(x2, result);
    else result.push(x2);
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
const el = (tag) => (props, ...children) => h$1(
  tag,
  props ?? {},
  children.flat().map((child) => typeof child === "object" ? child : text(child))
);
const button$1 = el("button");
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
  return button$1({
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
};
const div$1 = el("div");
const table = el("table");
const thead = el("thead");
const tbody = el("tbody");
const tr = el("tr");
const th = el("th");
const td = el("td");
const ol = el("ol");
const li$1 = el("li");
const convertJsonToNavigatorItem = function(props) {
  const { parent, name, data, getEntries, isNode, depth = 0, extension } = props;
  const result = {
    parent,
    name,
    path: parent ? parent.path + "/" + name : "/" + name
  };
  if (extension) {
    const ext = extension(result, data, depth);
    if (ext) result.extension = ext;
  }
  const properties = {};
  let hasProperty = false;
  const children = [];
  getEntries(data, depth).forEach((entry) => {
    const isProperty = typeof entry.data !== "object" || Array.isArray(entry.data);
    if (isProperty) {
      properties[entry.name] = entry.data;
      hasProperty = true;
    } else {
      children.push(convertJsonToNavigatorItem({
        parent: result,
        name: entry.name,
        data: entry.data,
        getEntries,
        isNode: entry.isNode,
        depth: depth + 1,
        extension
      }));
    }
  });
  if (hasProperty) result.properties = properties;
  if (isNode) result.children = children;
  return result;
};
const getParentItems = (item) => {
  if (!item) return [];
  const result = [];
  let cd = item.parent;
  while (cd) {
    result.push(cd);
    cd = cd.parent;
  }
  return result.reverse();
};
const NavigatorFinder = function(props) {
  const {
    state,
    currentKeys,
    maxItemsCount = 0,
    itemClick,
    afterRender,
    extension
  } = props;
  const current = getValue(state, currentKeys, void 0);
  const createColumns = props.columns ?? ((directory) => {
    const result = [];
    if (!directory) return result;
    result.push({
      name: "name",
      val: (item) => item.name
    });
    const children = directory.children;
    if (children) {
      const names = [];
      children.forEach((child) => {
        if (!child.children) return;
        if (child.properties) {
          Object.keys(child.properties).forEach((key) => names.push(key));
        }
      });
      Array.from(new Set(names)).forEach((name) => {
        result.push({
          name,
          val: (item) => {
            const p = item.properties;
            return p ? p[name] ?? "" : "";
          }
        });
      });
    }
    return result;
  });
  const columns = createColumns(current);
  const parentItems = getParentItems(current);
  if (current) parentItems.push(current);
  const getItems = (item) => {
    if (!item || item.children === void 0) return [];
    const count2 = maxItemsCount === 0 ? item.children.length : Math.min(maxItemsCount, item.children.length);
    return item.children.slice(0, count2);
  };
  const items = getItems(current);
  const count = current ? current.children?.length : 0;
  const action_parentClick = (state2, item) => {
    return setValue(state2, currentKeys, item);
  };
  const action_itemClick = (state2, item) => {
    const children = item.children;
    if (!children) return state2;
    if (!children.some((child) => typeof child === "object" && !Array.isArray(child))) return state2;
    return setValue(state2, currentKeys, item);
  };
  const vnode = div$1(
    {
      ...deleteKeys(props, "state", "currentKeys", "columns", "itemClick", "afterRender", "extension")
    },
    // toolBar
    div$1({
      class: "toolBar"
    }, "toolBar (未実装)"),
    // parentItems
    ol(
      {},
      parentItems.map((parent) => li$1({
        key: parent.path,
        onclick: [action_parentClick, parent]
      }, parent.name))
    ),
    // items
    table(
      {},
      thead(
        {},
        tr(
          {},
          columns.map((col) => th({}, col.name))
        )
      ),
      tbody(
        {},
        items.map((item) => tr(
          {
            key: item.path,
            onclick: item.children === void 0 ? itemClick ? [itemClick, item] : void 0 : [action_itemClick, item]
          },
          columns.map((col) => td(
            {
              title: col.val(item)
            },
            col.val(item)
          ))
        ))
      )
    ),
    // statusBar
    div$1({
      class: "statusBar"
    }, `items ${items.length} / ${count}`)
  );
  return afterRender ? afterRender({ state, current, extension }, vnode) : vnode;
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
    getValue(state, keyNames, []).filter((task) => !task.isDone).sort((a, b2) => b2.priority - a.priority)
  ];
};
const progress_easing = {
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
  }
};
const div = el("div");
const ul = el("ul");
const li = el("li");
const button = el("button");
const Carousel = function(props, children) {
  const { state, id: id2, keyNames, controlButton, controlBar, skipSpeedRate } = props;
  const task = getValue(state, keyNames, []).find((task2) => task2.id === id2);
  const param2 = task?.extension?.carouselState;
  const controller = task?.extension.carouselController;
  const index = param2?.reportPageIndex ? getValue(state, param2.reportPageIndex, 0) : getValue(state, [createLocalKey(id2), "reportPageIndex"], 0);
  const items = Array.isArray(children) ? children : [children];
  const action_mouseenter = (state2) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    task2.paused = true;
    return state2;
  };
  const action_mouseleave = (state2) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    task2.paused = false;
    return state2;
  };
  const action_prevPage = (state2) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    controller.step(
      task2,
      -1,
      skipSpeedRate ?? 0.3
    );
    return state2;
  };
  const action_nextPage = (state2) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    controller.step(
      task2,
      1,
      skipSpeedRate ?? 0.3
    );
    return state2;
  };
  const action_ControlBarClick = (state2, absoluteIndex) => {
    const task2 = getValue(state2, keyNames, []).find((task3) => task3.id === id2);
    if (!task2) return state2;
    const param22 = task2.extension?.carouselState;
    if (!param22) return state2;
    controller.moveTo(
      task2,
      absoluteIndex,
      skipSpeedRate ?? 0.3
    );
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
    // controlButton, controlBar
    controlButton || controlBar ? div(
      {},
      controlButton ? button({ onclick: action_prevPage }, "<") : null,
      controlBar ? ul(
        {},
        items.map((_2, i) => li(
          {
            class: i === index && "select",
            onclick: [action_ControlBarClick, i]
          },
          // param が取れない場合、選択なしにする
          param2 ? i === index ? "◉" : "・" : "・"
        ))
      ) : null,
      controlButton ? button({ onclick: action_nextPage }, ">") : null
    ) : null
  );
};
const effect_InitCarousel = function(keyNames, carouselState) {
  return (dispatch) => {
    (async () => {
      const param2 = carouselState;
      const easing = param2.easing ?? ((t) => t);
      const div2 = document.getElementById(param2.id);
      if (!div2) return;
      const ul2 = div2.querySelector("ul");
      if (!ul2) return;
      const cloneClass = `${param2.id}_clone`;
      const children = Array.from(ul2.children).filter((li2, i) => {
        if (li2.classList.contains(cloneClass)) {
          li2.remove();
          return false;
        }
        li2.setAttribute("absoluteIndex", `${i}`);
        return true;
      });
      if (!children || children.length === 0) return;
      const waitImages = async () => {
        const images = Array.from(ul2.querySelectorAll("img"));
        return Promise.all(
          images.map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            });
          })
        );
      };
      await waitImages();
      const widths = children.map((child) => {
        const width = child.getBoundingClientRect().width;
        const style = getComputedStyle(child);
        const marginLeft = parseFloat(style.marginLeft);
        const marginRight = parseFloat(style.marginRight);
        return width + marginLeft + marginRight;
      });
      const ulStyle = getComputedStyle(ul2);
      const gap = parseFloat(ulStyle.columnGap || ulStyle.gap || "0");
      const ulGap = isNaN(gap) ? 0 : gap;
      const reportPageIndex = param2.reportPageIndex ?? [createLocalKey(param2.id), "reportPageIndex"];
      dispatch((state) => {
        const privateParam = {
          ul: ul2,
          step: 0,
          index: 0,
          startOffset: 0,
          targetOffset: 0,
          currentOffset: 0,
          cloneNodes: []
        };
        const getCurrentState = () => {
          let relativeIndex = -1;
          let absoluteIndex = -1;
          let offset = 0;
          for (let i = 0, width = offset; i < privateParam.ul.children.length; i++) {
            const li2 = privateParam.ul.children[i];
            const index = Number(li2.getAttribute("absoluteIndex"));
            if (Math.abs(privateParam.currentOffset) >= width) {
              relativeIndex = i;
              absoluteIndex = index;
              offset = privateParam.currentOffset + width;
            }
            width += widths[absoluteIndex];
            if (i !== 0) width += ulGap;
          }
          return {
            relativeIndex,
            absoluteIndex,
            offset,
            toggleCount: privateParam.step < 0 ? Math.abs(privateParam.step) - relativeIndex : relativeIndex
          };
        };
        const controller = {
          // ---------- ---------- ----------
          // controller.step
          // ---------- ---------- ----------
          step: (rafTask, delta, skipSpeedRate) => {
            const paused = rafTask.paused;
            rafTask.paused = true;
            return new Promise((resolve, reject) => {
              const currentState = getCurrentState();
              privateParam.cloneNodes.forEach((node) => node.remove());
              privateParam.cloneNodes = [];
              for (let i = 0; i < currentState.toggleCount; i++) {
                const node = privateParam.step < 0 ? privateParam.ul.lastChild : privateParam.ul.firstChild;
                if (node) {
                  if (privateParam.step < 0) {
                    privateParam.ul.insertBefore(node, privateParam.ul.firstChild);
                  } else {
                    privateParam.ul.appendChild(node);
                  }
                }
              }
              let cloneWidth = 0;
              for (let i = 0; i < Math.abs(delta); i++) {
                const index = delta < 0 ? privateParam.ul.children.length - 1 - i : i;
                const cloneNode = privateParam.ul.children[index].cloneNode(true);
                cloneNode.classList.add(cloneClass);
                privateParam.cloneNodes.push(cloneNode);
                if (delta < 0) {
                  privateParam.ul.insertBefore(cloneNode, privateParam.ul.firstChild);
                } else {
                  privateParam.ul.appendChild(cloneNode);
                }
                const absoluteIndex = Number(cloneNode.getAttribute("absoluteIndex"));
                cloneWidth += widths[absoluteIndex];
                if (i !== 0) cloneWidth += ulGap;
              }
              privateParam.step = delta;
              privateParam.index = ((currentState.absoluteIndex + delta) % children.length + children.length) % children.length;
              privateParam.startOffset = delta < 0 ? currentState.offset - cloneWidth : currentState.offset;
              privateParam.currentOffset = privateParam.startOffset;
              privateParam.targetOffset = delta < 0 ? 0 : -cloneWidth;
              privateParam.ul.style.transform = `translateX(${privateParam.currentOffset}px)`;
              const newTask = new RAFTask({
                id: `${param2.id}_step`,
                duration: rafTask.duration * (skipSpeedRate ?? 0.1),
                action,
                finish: (state2, rafTask2) => {
                  rafTask2.paused = paused;
                  const res = finish(state2, rafTask2);
                  const newState = Array.isArray(res) ? res[0] : res;
                  rafTask2.paused = paused;
                  resolve(rafTask2);
                  return newState;
                }
              });
              requestAnimationFrame(() => dispatch((state2) => {
                const tasks = getValue(state2, keyNames, []).filter((task) => task.id !== `${param2.id}_step` && task.id !== param2.id).concat(newTask);
                return setValue(state2, keyNames, tasks);
              }));
            });
          },
          // end controller.step
          // ---------- ---------- ----------
          // controller.moveTo
          // ---------- ---------- ----------
          moveTo: (rafTask, index, skipSpeedRate) => {
            return controller.step(
              rafTask,
              index - getCurrentState().absoluteIndex,
              skipSpeedRate
            );
          }
        };
        const action = (state2, rafTask) => {
          if (!privateParam.ul.isConnected) return state2;
          if (rafTask.paused) return state2;
          privateParam.currentOffset = privateParam.startOffset + (privateParam.targetOffset - privateParam.startOffset) * easing(rafTask.progress);
          privateParam.ul.style.transform = `translateX(${privateParam.currentOffset}px)`;
          return [state2, (dispatch2) => {
            const fn = param2.action;
            if (fn) requestAnimationFrame(() => dispatch2((state3) => [fn, rafTask]));
          }];
        };
        const finish = (state2, rafTask) => {
          if (!privateParam.ul.isConnected) return state2;
          let newState = setValue(state2, reportPageIndex, privateParam.index);
          privateParam.cloneNodes.forEach((node) => node.remove());
          privateParam.cloneNodes = [];
          for (let i = 0; i < Math.abs(privateParam.step); i++) {
            const node = privateParam.step < 0 ? privateParam.ul.lastChild : privateParam.ul.firstChild;
            if (privateParam.step < 0) {
              privateParam.ul.insertBefore(node, privateParam.ul.firstChild);
            } else {
              privateParam.ul.appendChild(node);
            }
          }
          privateParam.step = param2.step;
          privateParam.index = ((privateParam.index + privateParam.step) % children.length + children.length) % children.length;
          let cloneWidth = 0;
          for (let i = 0; i < Math.abs(privateParam.step); i++) {
            const index = privateParam.step < 0 ? privateParam.ul.children.length - 1 - i : i;
            const cloneNode = privateParam.ul.children[index].cloneNode(true);
            cloneNode.classList.add(cloneClass);
            privateParam.cloneNodes.push(cloneNode);
            if (privateParam.step < 0) {
              privateParam.ul.insertBefore(cloneNode, privateParam.ul.firstChild);
            } else {
              privateParam.ul.appendChild(cloneNode);
            }
            const absoluteIndex = Number(cloneNode.getAttribute("absoluteIndex"));
            cloneWidth += widths[absoluteIndex];
            if (i !== 0) cloneWidth += ulGap;
          }
          privateParam.startOffset = privateParam.step < 0 ? -cloneWidth : 0;
          privateParam.targetOffset = privateParam.step < 0 ? 0 : -cloneWidth;
          privateParam.currentOffset = privateParam.startOffset;
          privateParam.ul.style.transform = `translateX(${privateParam.currentOffset}px)`;
          newState = setValue(
            newState,
            keyNames,
            getValue(newState, keyNames, []).filter((task) => task.id !== param2.id).concat(createTask())
          );
          return [newState, (dispatch2) => {
            const fn = param2.finish;
            if (fn) requestAnimationFrame(() => dispatch2((state3) => [fn, rafTask]));
          }];
        };
        const createTask = () => {
          return new RAFTask({
            id: param2.id,
            groupID: param2.groupID,
            duration: param2.duration ?? 1e3,
            delay: param2.delay ?? 2e3,
            action,
            finish,
            priority: param2.priority ?? 0,
            extension: {
              ...param2.extension,
              carouselState: param2,
              carouselController: controller
            }
          });
        };
        const startTask = new RAFTask({
          id: param2.id,
          groupID: param2.groupID,
          duration: 0,
          delay: 0,
          action: (state2, rafTask) => state2,
          finish,
          extension: {
            carouselState: param2,
            carouselController: controller
          }
        });
        return setValue(
          state,
          keyNames,
          getValue(state, keyNames, []).filter((task) => task.id !== param2.id).concat(startTask)
        );
      });
    })();
  };
};
function M() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var T = M();
function G(u3) {
  T = u3;
}
var _ = { exec: () => null };
function k(u3, e = "") {
  let t = typeof u3 == "string" ? u3 : u3.source, n = { replace: (r, i) => {
    let s = typeof i == "string" ? i : i.source;
    return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var Re = (() => {
  try {
    return !!new RegExp("(?<=1)(?<!1)");
  } catch {
    return false;
  }
})(), m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (u3) => new RegExp(`^( {0,3}${u3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}#`), htmlBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}<(?:[a-z].*>|!--)`, "i"), blockquoteBeginRegex: (u3) => new RegExp(`^ {0,${Math.min(3, u3 - 1)}}>`) }, Te = /^(?:[ \t]*(?:\n|$))+/, Oe = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, we = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, A = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ye = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, N = / {0,3}(?:[*+-]|\d{1,9}[.)])/, re = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, se = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Pe = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Q = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Se = /^[^\n]+/, j = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/, $e = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", j).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), _e = k(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, N).getRegex(), q = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", F = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Le = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", F).replace("tag", q).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ie = k(Q).replace("hr", A).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex(), Me = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ie).getRegex(), U = { blockquote: Me, code: Oe, def: $e, fences: we, heading: ye, hr: A, html: Le, lheading: se, list: _e, newline: Te, paragraph: ie, table: _, text: Se }, te = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", A).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex(), ze = { ...U, lheading: Pe, table: te, paragraph: k(Q).replace("hr", A).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", q).getRegex() }, Ee = { ...U, html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", F).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: _, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k(Q).replace("hr", A).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", se).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, Ie = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ae = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, oe = /^( {2,}|\\)\n(?!\s*$)/, Ce = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, v = /[\p{P}\p{S}]/u, K = /[\s\p{P}\p{S}]/u, ae = /[^\s\p{P}\p{S}]/u, Be = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, K).getRegex(), le = /(?!~)[\p{P}\p{S}]/u, De = /(?!~)[\s\p{P}\p{S}]/u, qe = /(?:[^\s\p{P}\p{S}]|~)/u, ue = /(?![*_])[\p{P}\p{S}]/u, ve = /(?![*_])[\s\p{P}\p{S}]/u, He = /(?:[^\s\p{P}\p{S}]|[*_])/u, Ge = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Re ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex(), pe = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, Ze = k(pe, "u").replace(/punct/g, v).getRegex(), Ne = k(pe, "u").replace(/punct/g, le).getRegex(), ce = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Qe = k(ce, "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, v).getRegex(), je = k(ce, "gu").replace(/notPunctSpace/g, qe).replace(/punctSpace/g, De).replace(/punct/g, le).getRegex(), Fe = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, v).getRegex(), Ue = k(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, ue).getRegex(), Ke = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", We = k(Ke, "gu").replace(/notPunctSpace/g, He).replace(/punctSpace/g, ve).replace(/punct/g, ue).getRegex(), Xe = k(/\\(punct)/, "gu").replace(/punct/g, v).getRegex(), Je = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ve = k(F).replace("(?:-->|$)", "-->").getRegex(), Ye = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ve).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), D = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/, et = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", D).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), he = k(/^!?\[(label)\]\[(ref)\]/).replace("label", D).replace("ref", j).getRegex(), ke = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", j).getRegex(), tt = k("reflink|nolink(?!\\()", "g").replace("reflink", he).replace("nolink", ke).getRegex(), ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/, W = { _backpedal: _, anyPunctuation: Xe, autolink: Je, blockSkip: Ge, br: oe, code: Ae, del: _, delLDelim: _, delRDelim: _, emStrongLDelim: Ze, emStrongRDelimAst: Qe, emStrongRDelimUnd: Fe, escape: Ie, link: et, nolink: ke, punctuation: Be, reflink: he, reflinkSearch: tt, tag: Ye, text: Ce, url: _ }, nt = { ...W, link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", D).getRegex(), reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", D).getRegex() }, Z = { ...W, emStrongRDelimAst: je, emStrongLDelim: Ne, delLDelim: Ue, delRDelim: We, url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex() }, rt = { ...Z, br: k(oe).replace("{2,}", "*").getRegex(), text: k(Z.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, C = { normal: U, gfm: ze, pedantic: Ee }, z = { normal: W, gfm: Z, breaks: rt, pedantic: nt };
var st = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, de = (u3) => st[u3];
function O(u3, e) {
  if (e) {
    if (m.escapeTest.test(u3)) return u3.replace(m.escapeReplace, de);
  } else if (m.escapeTestNoEncode.test(u3)) return u3.replace(m.escapeReplaceNoEncode, de);
  return u3;
}
function X(u3) {
  try {
    u3 = encodeURI(u3).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return u3;
}
function J(u3, e) {
  let t = u3.replace(m.findPipe, (i, s, a) => {
    let o = false, l = s;
    for (; --l >= 0 && a[l] === "\\"; ) o = !o;
    return o ? "|" : " |";
  }), n = t.split(m.splitPipe), r = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; r < n.length; r++) n[r] = n[r].trim().replace(m.slashPipe, "|");
  return n;
}
function E(u3, e, t) {
  let n = u3.length;
  if (n === 0) return "";
  let r = 0;
  for (; r < n; ) {
    let i = u3.charAt(n - r - 1);
    if (i === e && true) r++;
    else break;
  }
  return u3.slice(0, n - r);
}
function ge(u3, e) {
  if (u3.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < u3.length; n++) if (u3[n] === "\\") n++;
  else if (u3[n] === e[0]) t++;
  else if (u3[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function fe(u3, e = 0) {
  let t = e, n = "";
  for (let r of u3) if (r === "	") {
    let i = 4 - t % 4;
    n += " ".repeat(i), t += i;
  } else n += r, t++;
  return n;
}
function me(u3, e, t, n, r) {
  let i = e.href, s = e.title || null, a = u3[1].replace(r.other.outputLinkReplace, "$1");
  n.state.inLink = true;
  let o = { type: u3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i, title: s, text: a, tokens: n.inlineTokens(a) };
  return n.state.inLink = false, o;
}
function it(u3, e, t) {
  let n = u3.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let r = n[1];
  return e.split(`
`).map((i) => {
    let s = i.match(t.other.beginningSpace);
    if (s === null) return i;
    let [a] = s;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var w = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : E(n, `
`) };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], r = it(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: r };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let r = E(n, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
      }
      return { type: "heading", raw: t[0], depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return { type: "hr", raw: E(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = E(t[0], `
`).split(`
`), r = "", i = "", s = [];
      for (; n.length > 0; ) {
        let a = false, o = [], l;
        for (l = 0; l < n.length; l++) if (this.rules.other.blockquoteStart.test(n[l])) o.push(n[l]), a = true;
        else if (!a) o.push(n[l]);
        else break;
        n = n.slice(l);
        let p = o.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
        let d = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(c, s, true), this.lexer.state.top = d, n.length === 0) break;
        let h2 = s.at(-1);
        if (h2?.type === "code") break;
        if (h2?.type === "blockquote") {
          let R = h2, f = R.raw + `
` + n.join(`
`), S = this.blockquote(f);
          s[s.length - 1] = S, r = r.substring(0, r.length - R.raw.length) + S.raw, i = i.substring(0, i.length - R.text.length) + S.text;
          break;
        } else if (h2?.type === "list") {
          let R = h2, f = R.raw + `
` + n.join(`
`), S = this.list(f);
          s[s.length - 1] = S, r = r.substring(0, r.length - h2.raw.length) + S.raw, i = i.substring(0, i.length - R.raw.length) + S.raw, n = f.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: r, tokens: s, text: i };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), r = n.length > 1, i = { type: "list", raw: "", ordered: r, start: r ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
      let s = this.rules.other.listItemRegex(n), a = false;
      for (; e; ) {
        let l = false, p = "", c = "";
        if (!(t = s.exec(e)) || this.rules.block.hr.test(e)) break;
        p = t[0], e = e.substring(p.length);
        let d = fe(t[2].split(`
`, 1)[0], t[1].length), h2 = e.split(`
`, 1)[0], R = !d.trim(), f = 0;
        if (this.options.pedantic ? (f = 2, c = d.trimStart()) : R ? f = t[1].length + 1 : (f = d.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = d.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h2) && (p += h2 + `
`, e = e.substring(h2.length + 1), l = true), !l) {
          let S = this.rules.other.nextBulletRegex(f), V = this.rules.other.hrRegex(f), Y = this.rules.other.fencesBeginRegex(f), ee = this.rules.other.headingBeginRegex(f), xe = this.rules.other.htmlBeginRegex(f), be = this.rules.other.blockquoteBeginRegex(f);
          for (; e; ) {
            let H = e.split(`
`, 1)[0], I;
            if (h2 = H, this.options.pedantic ? (h2 = h2.replace(this.rules.other.listReplaceNesting, "  "), I = h2) : I = h2.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h2) || ee.test(h2) || xe.test(h2) || be.test(h2) || S.test(h2) || V.test(h2)) break;
            if (I.search(this.rules.other.nonSpaceChar) >= f || !h2.trim()) c += `
` + I.slice(f);
            else {
              if (R || d.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(d) || ee.test(d) || V.test(d)) break;
              c += `
` + h2;
            }
            R = !h2.trim(), p += H + `
`, e = e.substring(H.length + 1), d = I.slice(f);
          }
        }
        i.loose || (a ? i.loose = true : this.rules.other.doubleBlankLine.test(p) && (a = true)), i.items.push({ type: "list_item", raw: p, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: false, text: c, tokens: [] }), i.raw += p;
      }
      let o = i.items.at(-1);
      if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
      else return;
      i.raw = i.raw.trimEnd();
      for (let l of i.items) {
        if (this.lexer.state.top = false, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
          if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), l.tokens[0]?.type === "text" || l.tokens[0]?.type === "paragraph") {
            l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let c = this.lexer.inlineQueue.length - 1; c >= 0; c--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
              this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
              break;
            }
          }
          let p = this.rules.other.listTaskCheckbox.exec(l.raw);
          if (p) {
            let c = { type: "checkbox", raw: p[0] + " ", checked: p[0] !== "[ ]" };
            l.checked = c.checked, i.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = c.raw + l.tokens[0].raw, l.tokens[0].text = c.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(c)) : l.tokens.unshift({ type: "paragraph", raw: c.raw, text: c.raw, tokens: [c] }) : l.tokens.unshift(c);
          }
        }
        if (!i.loose) {
          let p = l.tokens.filter((d) => d.type === "space"), c = p.length > 0 && p.some((d) => this.rules.other.anyLine.test(d.raw));
          i.loose = c;
        }
      }
      if (i.loose) for (let l of i.items) {
        l.loose = true;
        for (let p of l.tokens) p.type === "text" && (p.type = "paragraph");
      }
      return i;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) return { type: "html", block: true, raw: t[0], pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: t[0] };
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: t[0], href: r, title: i };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = J(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = { type: "table", raw: t[0], header: [], align: [], rows: [] };
    if (n.length === r.length) {
      for (let a of r) this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
      for (let a = 0; a < n.length; a++) s.header.push({ text: n[a], tokens: this.lexer.inline(n[a]), header: true, align: s.align[a] });
      for (let a of i) s.rows.push(J(a, s.header.length).map((o, l) => ({ text: o, tokens: this.lexer.inline(o), header: false, align: s.align[l] })));
      return s;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) return { type: "heading", raw: t[0], depth: t[2].charAt(0) === "=" ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) };
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let s = E(n.slice(0, -1), "\\");
        if ((n.length - s.length) % 2 === 0) return;
      } else {
        let s = ge(t[2], "()");
        if (s === -2) return;
        if (s > -1) {
          let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
          t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, o).trim(), t[3] = "";
        }
      }
      let r = t[2], i = "";
      if (this.options.pedantic) {
        let s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else i = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), me(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[r.toLowerCase()];
      if (!i) {
        let s = n[0].charAt(0);
        return { type: "text", raw: s, text: s };
      }
      return me(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1, a, o, l = s, p = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = c.exec(t)) != null; ) {
        if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a) continue;
        if (o = [...a].length, r[3] || r[4]) {
          l += o;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
          p += o;
          continue;
        }
        if (l -= o, l > 0) continue;
        o = Math.min(o, o + l + p);
        let d = [...r[0]][0].length, h2 = e.slice(0, s + r.index + d + o);
        if (Math.min(s, o) % 2) {
          let f = h2.slice(1, -1);
          return { type: "em", raw: h2, text: f, tokens: this.lexer.inlineTokens(f) };
        }
        let R = h2.slice(2, -2);
        return { type: "strong", raw: h2, text: R, tokens: this.lexer.inlineTokens(R) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return r && i && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return { type: "br", raw: t[0] };
  }
  del(e, t, n = "") {
    let r = this.rules.inline.delLDelim.exec(e);
    if (!r) return;
    if (!(r[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1, a, o, l = s, p = this.rules.inline.delRDelim;
      for (p.lastIndex = 0, t = t.slice(-1 * e.length + s); (r = p.exec(t)) != null; ) {
        if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a || (o = [...a].length, o !== s)) continue;
        if (r[3] || r[4]) {
          l += o;
          continue;
        }
        if (l -= o, l > 0) continue;
        o = Math.min(o, o + l);
        let c = [...r[0]][0].length, d = e.slice(0, s + r.index + c + o), h2 = d.slice(s, -s);
        return { type: "del", raw: d, text: h2, tokens: this.lexer.inlineTokens(h2) };
      }
    }
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, r;
      return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, r;
      if (t[2] === "@") n = t[0], r = "mailto:" + n;
      else {
        let i;
        do
          i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (i !== t[0]);
        n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: t[0], escaped: n };
    }
  }
};
var x = class u {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new w(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
    let t = { other: m, block: C.normal, inline: z.normal };
    this.options.pedantic ? (t.block = C.pedantic, t.inline = z.pedantic) : this.options.gfm && (t.block = C.gfm, this.options.breaks ? t.inline = z.breaks : t.inline = z.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: C, inline: z };
  }
  static lex(e, t) {
    return new u(t).lex(e);
  }
  static lexInline(e, t) {
    return new u(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, "")); e; ) {
      let r;
      if (this.options.extensions?.block?.some((s) => (r = s.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        r.raw.length === 1 && s !== void 0 ? s.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let s = 1 / 0, a = e.slice(1), o;
        this.options.extensions.startBlock.forEach((l) => {
          o = l.call({ lexer: this }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
        }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let s = t.at(-1);
        n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (e) {
        let s = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(s);
          break;
        } else throw new Error(s);
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    let n = e, r = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i;
    for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let s = false, a = "";
    for (; e; ) {
      s || (a = ""), s = false;
      let o;
      if (this.options.extensions?.inline?.some((p) => (o = p.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false)) continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let p = t.at(-1);
        o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, a)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e, n, a)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0, c = e.slice(1), d;
        this.options.extensions.startInline.forEach((h2) => {
          d = h2.call({ lexer: this }, c), typeof d == "number" && d >= 0 && (p = Math.min(p, d));
        }), p < 1 / 0 && p >= 0 && (l = e.substring(0, p + 1));
      }
      if (o = this.tokenizer.inlineText(l)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s = true;
        let p = t.at(-1);
        p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let p = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(p);
          break;
        } else throw new Error(p);
      }
    }
    return t;
  }
};
var y = class {
  options;
  parser;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let r = (t || "").match(m.notSpaceStart)?.[0], i = e.replace(m.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + O(r) + '">' + (n ? i : O(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : O(i, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered, n = e.start, r = "";
    for (let a = 0; a < e.items.length; a++) {
      let o = e.items[a];
      r += this.listitem(o);
    }
    let i = t ? "ol" : "ul", s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0; i < e.header.length; i++) n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let r = "";
    for (let i = 0; i < e.rows.length; i++) {
      let s = e.rows[i];
      n = "";
      for (let a = 0; a < s.length; a++) n += this.tablecell(s[a]);
      r += this.tablerow({ text: n });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${O(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    let r = this.parser.parseInline(n), i = X(e);
    if (i === null) return r;
    e = i;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + O(t) + '"'), s += ">" + r + "</a>", s;
  }
  image({ href: e, title: t, text: n, tokens: r }) {
    r && (n = this.parser.parseInline(r, this.parser.textRenderer));
    let i = X(e);
    if (i === null) return O(n);
    e = i;
    let s = `<img src="${e}" alt="${O(n)}"`;
    return t && (s += ` title="${O(t)}"`), s += ">", s;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
  }
};
var $ = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var b = class u2 {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || T, this.options.renderer = this.options.renderer || new y(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $();
  }
  static parse(e, t) {
    return new u2(t).parse(e);
  }
  static parseInline(e, t) {
    return new u2(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let r = e[n];
      if (this.options.extensions?.renderers?.[r.type]) {
        let s = r, a = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (a !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s.type)) {
          t += a || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "space": {
          t += this.renderer.space(i);
          break;
        }
        case "hr": {
          t += this.renderer.hr(i);
          break;
        }
        case "heading": {
          t += this.renderer.heading(i);
          break;
        }
        case "code": {
          t += this.renderer.code(i);
          break;
        }
        case "table": {
          t += this.renderer.table(i);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(i);
          break;
        }
        case "list": {
          t += this.renderer.list(i);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(i);
          break;
        }
        case "html": {
          t += this.renderer.html(i);
          break;
        }
        case "def": {
          t += this.renderer.def(i);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(i);
          break;
        }
        case "text": {
          t += this.renderer.text(i);
          break;
        }
        default: {
          let s = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) return console.error(s), "";
          throw new Error(s);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    let n = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (a !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += a || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "escape": {
          n += t.text(s);
          break;
        }
        case "html": {
          n += t.html(s);
          break;
        }
        case "link": {
          n += t.link(s);
          break;
        }
        case "image": {
          n += t.image(s);
          break;
        }
        case "checkbox": {
          n += t.checkbox(s);
          break;
        }
        case "strong": {
          n += t.strong(s);
          break;
        }
        case "em": {
          n += t.em(s);
          break;
        }
        case "codespan": {
          n += t.codespan(s);
          break;
        }
        case "br": {
          n += t.br(s);
          break;
        }
        case "del": {
          n += t.del(s);
          break;
        }
        case "text": {
          n += t.text(s);
          break;
        }
        default: {
          let a = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent) return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return n;
  }
};
var P = class {
  options;
  block;
  constructor(e) {
    this.options = e || T;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer() {
    return this.block ? x.lex : x.lexInline;
  }
  provideParser() {
    return this.block ? b.parse : b.parseInline;
  }
};
var B = class {
  defaults = M();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = b;
  Renderer = y;
  TextRenderer = $;
  Lexer = x;
  Tokenizer = w;
  Hooks = P;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let r of e) switch (n = n.concat(t.call(this, r)), r.type) {
      case "table": {
        let i = r;
        for (let s of i.header) n = n.concat(this.walkTokens(s.tokens, t));
        for (let s of i.rows) for (let a of s) n = n.concat(this.walkTokens(a.tokens, t));
        break;
      }
      case "list": {
        let i = r;
        n = n.concat(this.walkTokens(i.items, t));
        break;
      }
      default: {
        let i = r;
        this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
          let a = i[s].flat(1 / 0);
          n = n.concat(this.walkTokens(a, t));
        }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
      }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let r = { ...n };
      if (r.async = this.defaults.async || r.async || false, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name) throw new Error("extension name required");
        if ("renderer" in i) {
          let s = t.renderers[i.name];
          s ? t.renderers[i.name] = function(...a) {
            let o = i.renderer.apply(this, a);
            return o === false && (o = s.apply(this, a)), o;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let s = t[i.level];
          s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), r.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new y(this.defaults);
        for (let s in n.renderer) {
          if (!(s in i)) throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s)) continue;
          let a = s, o = n.renderer[a], l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c || "";
          };
        }
        r.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new w(this.defaults);
        for (let s in n.tokenizer) {
          if (!(s in i)) throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s)) continue;
          let a = s, o = n.tokenizer[a], l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c;
          };
        }
        r.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new P();
        for (let s in n.hooks) {
          if (!(s in i)) throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s)) continue;
          let a = s, o = n.hooks[a], l = i[a];
          P.passThroughHooks.has(s) ? i[a] = (p) => {
            if (this.defaults.async && P.passThroughHooksRespectAsync.has(s)) return (async () => {
              let d = await o.call(i, p);
              return l.call(i, d);
            })();
            let c = o.call(i, p);
            return l.call(i, c);
          } : i[a] = (...p) => {
            if (this.defaults.async) return (async () => {
              let d = await o.apply(i, p);
              return d === false && (d = await l.apply(i, p)), d;
            })();
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c;
          };
        }
        r.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens, s = n.walkTokens;
        r.walkTokens = function(a) {
          let o = [];
          return o.push(s.call(this, a)), i && (o = o.concat(i.call(this, a))), o;
        };
      }
      this.defaults = { ...this.defaults, ...r };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, r) => {
      let i = { ...r }, s = { ...this.defaults, ...i }, a = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === true && i.async === false) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return a(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = e), s.async) return (async () => {
        let o = s.hooks ? await s.hooks.preprocess(n) : n, p = await (s.hooks ? await s.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s), c = s.hooks ? await s.hooks.processAllTokens(p) : p;
        s.walkTokens && await Promise.all(this.walkTokens(c, s.walkTokens));
        let h2 = await (s.hooks ? await s.hooks.provideParser() : e ? b.parse : b.parseInline)(c, s);
        return s.hooks ? await s.hooks.postprocess(h2) : h2;
      })().catch(a);
      try {
        s.hooks && (n = s.hooks.preprocess(n));
        let l = (s.hooks ? s.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s);
        s.hooks && (l = s.hooks.processAllTokens(l)), s.walkTokens && this.walkTokens(l, s.walkTokens);
        let c = (s.hooks ? s.hooks.provideParser() : e ? b.parse : b.parseInline)(l, s);
        return s.hooks && (c = s.hooks.postprocess(c)), c;
      } catch (o) {
        return a(o);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let r = "<p>An error occurred:</p><pre>" + O(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(r) : r;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var L = new B();
function g(u3, e) {
  return L.parse(u3, e);
}
g.options = g.setOptions = function(u3) {
  return L.setOptions(u3), g.defaults = L.defaults, G(g.defaults), g;
};
g.getDefaults = M;
g.defaults = T;
g.use = function(...u3) {
  return L.use(...u3), g.defaults = L.defaults, G(g.defaults), g;
};
g.walkTokens = function(u3, e) {
  return L.walkTokens(u3, e);
};
g.parseInline = L.parseInline;
g.Parser = b;
g.parser = b.parse;
g.Renderer = y;
g.TextRenderer = $;
g.Lexer = x;
g.lexer = x.lex;
g.Tokenizer = w;
g.Hooks = P;
g.parse = g;
g.options;
g.setOptions;
g.use;
g.walkTokens;
g.parseInline;
b.parse;
x.lex;
const param = {
  tasks: [],
  page: "0",
  readme: "readme",
  carousel: {
    pageNumber: 0
  },
  navigator: {
    finder_current: void 0
  }
};
addEventListener("load", () => {
  const tasks = ["tasks"];
  const page = ["page"];
  const navigator_finder = ["navigator", "finder_current"];
  const action_initCarousel = (state) => {
    const effect_readme = async (dispatch) => {
      const readme = await fetch("md/Carousel.md").then((data) => {
        if (!data.ok) throw new Error("error readme");
        return data.text();
      });
      dispatch((state2) => setValue(state2, ["readme"], readme));
    };
    const param1 = {
      id: "sample_carousel1",
      step: 1
    };
    const param2 = {
      id: "sample_carousel2",
      step: -1,
      duration: 3e3,
      delay: 500,
      easing: progress_easing.easeOutBounce
    };
    const param3 = {
      id: "sample_carousel3",
      step: 1,
      duration: 2e3,
      delay: 0,
      finish: (state2, rafTask) => {
        const id2 = "sample_carousel3";
        const dom = document.getElementById(id2);
        if (!dom) return state2;
        const ul2 = dom.querySelector("ul");
        if (!ul2) return state2;
        const child = ul2.firstChild;
        if (!child) return state2;
        const pageNumber = Number(child.getAttribute("absoluteIndex"));
        if (pageNumber !== 0 && pageNumber !== 3) return state2;
        const newTask = rafTask.clone();
        const param4 = newTask.extension?.carouselState;
        if (!param4) return state2;
        param4.step = pageNumber === 0 ? 1 : -1;
        return setValue(
          state2,
          tasks,
          state2.tasks.filter((task) => task.id !== id2).concat(newTask)
        );
      }
    };
    return [
      state,
      effect_readme,
      effect_InitCarousel(tasks, param1),
      effect_InitCarousel(tasks, param2),
      effect_InitCarousel(tasks, param3)
    ];
  };
  const action_initNavigator = (state) => {
    const effect_readme = async (dispatch) => {
      const readme = await fetch("md/Navigator.md").then((data) => {
        if (!data.ok) throw new Error("error readme");
        return data.text();
      });
      dispatch((state2) => setValue(state2, ["readme"], readme));
    };
    const effect_loadJson = async (dispatch) => {
      const json = await fetch("isYoshihiro.json").then((data) => {
        if (!data.ok) throw new Error("error loadJson");
        return data.json();
      });
      const getEntries = (data, depth) => {
        const result = [];
        Object.keys(data).forEach((key) => {
          const obj = data[key];
          result.push({
            name: key,
            data: obj,
            isNode: typeof obj === "object" && !Array.isArray(obj)
          });
        });
        return result;
      };
      const rootItem = convertJsonToNavigatorItem({
        parent: null,
        name: "isYoshihiro",
        data: json,
        getEntries,
        isNode: true,
        extension: (item, data, depth) => {
          return {
            depth
          };
        }
      });
      dispatch((state2) => setValue(state2, navigator_finder, rootItem));
    };
    return [
      state,
      effect_readme,
      effect_loadJson
    ];
  };
  app({
    view: (state) => /* @__PURE__ */ h("div", { id: "app" }, /* @__PURE__ */ h("nav", null, /* @__PURE__ */ h("ul", null, /* @__PURE__ */ h("li", null, /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        id: "carousel",
        keyNames: page,
        onclick: action_initCarousel
      },
      "Carousel"
    )), /* @__PURE__ */ h("li", null, /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        id: "navigator",
        keyNames: page,
        onclick: action_initNavigator
      },
      "Navigator"
    )))), /* @__PURE__ */ h("main", null, /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(
      Route,
      {
        state,
        keyNames: page,
        match: "carousel"
      },
      /* @__PURE__ */ h("h2", null, "Carousel"),
      /* @__PURE__ */ h("h3", null, "#sample_carousel1"),
      /* @__PURE__ */ h(
        Carousel,
        {
          state,
          id: "sample_carousel1",
          keyNames: tasks,
          class: "carousel"
        },
        /* @__PURE__ */ h("img", { src: "./sample-image/pic1.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/pic2.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/pic3.jpg" })
      ),
      /* @__PURE__ */ h("h3", null, "#sample_carousel2"),
      /* @__PURE__ */ h(
        Carousel,
        {
          state,
          id: "sample_carousel2",
          keyNames: tasks,
          class: "carousel",
          controlButton: true,
          controlBar: true
        },
        /* @__PURE__ */ h("img", { src: "./sample-image/pic1.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/pic2.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/pic3.jpg" })
      ),
      /* @__PURE__ */ h("h3", null, "#sample_carousel3"),
      /* @__PURE__ */ h(
        Carousel,
        {
          state,
          id: "sample_carousel3",
          keyNames: tasks,
          class: "carousel",
          controlBar: true
        },
        /* @__PURE__ */ h("img", { src: "./sample-image/img1.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/img2.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/img3.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/img4.jpg" }),
        /* @__PURE__ */ h("img", { src: "./sample-image/img5.jpg" })
      )
    ), /* @__PURE__ */ h(
      Route,
      {
        state,
        keyNames: page,
        match: "navigator"
      },
      /* @__PURE__ */ h("h2", null, "Navigator"),
      /* @__PURE__ */ h("h3", null, "#sample_navigatorFinder"),
      /* @__PURE__ */ h(
        NavigatorFinder,
        {
          state,
          id: "navigator_finder",
          currentKeys: navigator_finder
        }
      )
    ))), /* @__PURE__ */ h(
      "aside",
      {
        class: "markdown-body",
        innerHTML: g(state.readme)
      }
    )),
    node: document.getElementById("app"),
    init: param,
    subscriptions: (state) => [
      subscription_RAFManager(state, tasks)
    ]
  });
});
