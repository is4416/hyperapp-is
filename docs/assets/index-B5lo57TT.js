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
function flattenAll(input2, result = []) {
  input2.forEach((x) => {
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
const button$2 = el("button");
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
  return button$2({
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
  return button$2({
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
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
  let properties = {};
  let hasProperties = false;
  const children = [];
  getEntries(data, depth).forEach((entry) => {
    const isProperty = typeof entry.data !== "object" || Array.isArray(entry.data);
    if (isProperty) {
      properties[entry.name] = entry.data;
      hasProperties = true;
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
  if (hasProperties) result.properties = properties;
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
const div$1 = el("div");
const table = el("table");
const thead = el("thead");
const tbody = el("tbody");
const tr = el("tr");
const th = el("th");
const td = el("td");
const ol = el("ol");
const ul$1 = el("ul");
const li$1 = el("li");
const button$1 = el("button");
const input = el("input");
const span = el("span");
const svg = el("svg");
const rect = el("rect");
const path = el("path");
const NavigatorFinder = function(props) {
  const {
    state,
    id: id2,
    currentKeys,
    plugIn,
    afterRender
  } = props;
  const current = getValue(state, currentKeys, void 0);
  const localState = getLocalState(state, id2, {
    searchText: "",
    // 検索テキスト
    selected: [],
    // 選択されているボタン名
    sortType: void 0,
    // ソート用比較関数: (a: NavigatorItem, b: NavigatorItem) => number
    reverse: false,
    // ソートを逆順にするか
    sortKey: void 0
    // 使用されているソート名 (column.name)
  });
  const isFilter = localState.selected.includes(`${createLocalKey(id2)}_filter`);
  const createColumns = props.columns ?? ((directory) => {
    const result = [];
    if (!directory) return result;
    result.push({
      name: "name",
      val: (item) => item.name,
      compare: (a, b) => {
        return a.name.localeCompare(b.name);
      }
    });
    const children = directory.children;
    if (children) {
      const names = [];
      children.forEach((child) => {
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
  const hitTest = (text2) => {
    if (typeof text2 !== "string") return false;
    const S = localState.searchText.trim().toLowerCase();
    if (S === "") return false;
    const keys = S.replace(/[ 　]+/g, " ").split(" ").filter(Boolean);
    if (keys.length === 0) return false;
    const sText = text2.toLowerCase();
    return keys.every((key) => sText.includes(key));
  };
  const getItems = (item) => {
    if (!item || item.children === void 0) return [];
    const result = isFilter && localState.searchText !== "" ? item.children.filter((child) => {
      return columns.some((col) => hitTest(
        col.text ? col.text(child) : col.val(child)
      ));
    }) : item.children;
    return result;
  };
  const items = getItems(current);
  if (localState.sortType) {
    items.sort(localState.sortType);
    if (localState.reverse) items.reverse();
  }
  const count = current ? current.children?.length : 0;
  const hitCount = isFilter ? items.length : items.filter((item) => columns.some((col) => hitTest(
    col.text ? col.text(item) : col.val(item)
  ))).length;
  const message = `hit items = ${hitCount} / ${count}`;
  const action_parentClick = (state2, item) => {
    return setLocalState(
      setValue(state2, currentKeys, item),
      id2,
      {
        selected: []
      }
    );
  };
  const action_itemClick = (state2, item) => {
    const children = item.children;
    if (!children || children.length === 0) return state2;
    return setLocalState(
      setValue(state2, currentKeys, item),
      id2,
      {
        selected: []
      }
    );
  };
  const action_inputSearchText = (state2, e) => {
    const input2 = e.currentTarget;
    if (!input2) return state2;
    return setLocalState(state2, id2, {
      searchText: input2.value
    });
  };
  const action_sort = (state2, column) => {
    if (column.compare === void 0) return state2;
    return setLocalState(state2, id2, {
      sortType: column.compare,
      reverse: localState.sortKey === column.name ? !localState.reverse : false,
      sortKey: column.name
    });
  };
  const toolBarNode = div$1(
    {
      class: "toolBar"
    },
    input({
      type: "text",
      placeholder: "search keys",
      value: localState.searchText,
      oninput: action_inputSearchText
    }),
    button$1({
      type: "button",
      title: "delete keys",
      onclick: (state2) => {
        return setLocalState(state2, id2, {
          searchText: ""
        });
      }
    }, icon_trashBox),
    SelectButton({
      state,
      id: `${createLocalKey(id2)}_filter`,
      keyNames: [createLocalKey(id2), "selected"],
      title: "filter"
    }, icon_filter)
  );
  const parentItemsNode = div$1(
    {
      class: "parentItems"
    },
    ol(
      {},
      parentItems.map((parent) => li$1({
        key: parent.path,
        onclick: [action_parentClick, parent]
      }, parent.name))
    )
  );
  const itemsNode = div$1(
    {
      class: "items"
    },
    table(
      {},
      thead(
        {},
        tr(
          {},
          columns.map((col) => th(
            {
              class: col.compare ? "sort" : "",
              onclick: [action_sort, col]
            },
            col.name + (localState.sortKey === col.name ? localState.reverse ? " ▼" : " ▲" : "")
          ))
        )
      ),
      tbody(
        {},
        items.map((item) => tr(
          {
            key: item.path,
            class: item.children === void 0 ? "file" : "directory",
            onclick: item.children === void 0 ? void 0 : [action_itemClick, item]
          },
          columns.map((col) => {
            const v = col.val(item);
            const t = col.text ? col.text(item) : typeof v === "string" ? v : "";
            return td(
              {
                title: t
              },
              span(
                {
                  class: hitTest(t) ? "hit" : ""
                },
                v
              )
            );
          })
        ))
      )
    )
  );
  const statusBarNode = div$1({ class: "statusBar" }, message);
  const vnode = div$1(
    {
      ...deleteKeys(
        props,
        "state",
        "currentKeys",
        "columns",
        "plugIn",
        "toolBarNode",
        "parentItemsNode",
        "statusBarNode",
        "afterRender"
      )
    },
    div$1(
      {
        class: "rapper"
      },
      props.toolBarNode ? props.toolBarNode(state, localState, toolBarNode) : toolBarNode,
      props.parentItemsNode ? props.parentItemsNode(state, localState, parentItemsNode) : parentItemsNode,
      itemsNode,
      props.statusBarNode ? props.statuBarNode(state, localState, statusBarNode) : statusBarNode
    ),
    // plugIn
    plugIn ? plugIn(state, localState) : []
  );
  return afterRender ? afterRender(state, localState, vnode) : vnode;
};
const icon_depth = svg(
  {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  rect({
    x: 9,
    y: 3,
    width: 6,
    height: 4,
    rx: 1
  }),
  rect({
    x: 3,
    y: 15,
    width: 6,
    height: 4,
    rx: 1
  }),
  rect({
    x: 15,
    y: 15,
    width: 6,
    height: 4,
    rx: 1
  }),
  path({
    d: "M12 7v4"
  }),
  path({
    d: "M6 15v-4h12v4"
  })
);
const icon_name = svg(
  {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M4 18l2-8 2 8M5 14h2" }),
  path({ d: "M10 10h6l-6 8h6" }),
  path({ d: "M20 6v12" }),
  path({ d: "M17 15l3 3 3-3" })
);
const icon_directory = svg(
  {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z" })
);
const icon_file = svg(
  {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" }),
  path({ d: "M14 2v6h6" })
);
const icon_trashBox = svg(
  {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M3 6h18" }),
  path({ d: "M8 6V4h8v2" }),
  path({ d: "M6 6l1 14h10l1-14" }),
  path({ d: "M10 11v6" }),
  path({ d: "M14 11v6" })
);
const icon_filter = svg(
  {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M3 5h18" }),
  path({ d: "M6 12h12" }),
  path({ d: "M10 19h4" })
);
svg(
  {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  },
  path({ d: "M9 9h11v11H9z" }),
  path({ d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
);
const NavigatorSearch = function(props) {
  const {
    state,
    id: id2,
    currentKeys,
    searchResult,
    hitTest,
    afterRender
  } = props;
  const localState = getLocalState(state, id2, {
    maxItemsCount: props.maxItemsCount,
    // カードの最大表示数
    sortName: void 0,
    // ソート名
    sortFn: void 0,
    // 比較関数
    isDirectory: true,
    // ディレクトリを表示
    isFile: true
    // ファイルを表示
  });
  const current = getValue(state, currentKeys, void 0);
  const searchItems = (item, depth) => {
    if (!item) return [];
    const result = [];
    if (hitTest(item)) result.push({ item, depth });
    if (item.children && item.children.length !== 0) {
      item.children.forEach((child) => {
        const r = searchItems(child, depth + 1);
        if (r.length !== 0) result.push(...r);
      });
    }
    return result;
  };
  const items = current ? searchItems(current, 0) : [];
  if (localState.sortFn !== void 0) items.sort(localState.sortFn);
  const drawItems = items.filter((item) => {
    return item.item.children ? localState.isDirectory : localState.isFile;
  }).slice(0, localState.maxItemsCount);
  const parentItems = current ? getParentItems(current).concat(current) : [];
  const message = `hit ${items.length} items`;
  const action_itemsScroll = (state2, e) => {
    const margin = getScrollMargin(e);
    return setLocalState(state2, id2, {
      maxItemsCount: margin.bottom < 10 ? localState.maxItemsCount + 10 < items.length ? localState.maxItemsCount + 10 : Math.max(10, items.length) : localState.maxItemsCount
    });
  };
  const action_setSort = (state2, newSortName) => {
    const reverse = localState.sortName === newSortName;
    const obj = {
      "depth": (a, b) => a.depth - b.depth,
      "name": (a, b) => {
        if (a.item.name === b.item.name) return 0;
        return a.item.name < b.item.name ? -1 : 1;
      }
    };
    const fn = obj[newSortName] !== void 0 ? reverse ? (a, b) => obj[newSortName](b, a) : (a, b) => obj[newSortName](a, b) : (a, b) => {
      return a.depth === b.depth ? obj["name"](a, b) : obj["depth"](a, b);
    };
    return setLocalState(state2, id2, {
      sortName: reverse ? `r_${newSortName}` : newSortName,
      sortFn: fn
    });
  };
  const toolBarNode = div$1(
    {
      class: "toolBar"
    },
    // sort
    button$1({
      type: "button",
      title: "sort depth",
      onclick: [action_setSort, "depth"]
    }, icon_depth),
    button$1({
      type: "button",
      title: "sort name",
      onclick: [action_setSort, "name"]
    }, icon_name),
    // filter
    button$1({
      type: "button",
      class: localState.isDirectory ? "" : "ignore",
      title: "directory",
      onclick: (state2) => setLocalState(state2, id2, {
        isDirectory: !localState.isDirectory
      })
    }, icon_directory),
    button$1({
      type: "button",
      class: localState.isFile ? "" : "ignore",
      title: "file",
      onclick: (state2) => setLocalState(state2, id2, {
        isFile: !localState.isFile
      })
    }, icon_file)
  );
  const parentItemsNode = div$1(
    {
      class: "parentItems"
    },
    ol(
      {},
      parentItems.map((item) => li$1({
        onclick: (state2) => setValue(state2, currentKeys, item)
      }, item.name))
    )
  );
  const itemsNode = div$1(
    {
      class: "items",
      onscroll: action_itemsScroll
    },
    ul$1(
      {},
      drawItems.map((item) => li$1({
        class: "item",
        key: item.item.path,
        title: item.item.path
      }, searchResult(item.item, item.depth)))
    )
  );
  const statusBarNode = div$1({
    class: "statusBar"
  }, message);
  const vnode = div$1(
    {
      ...deleteKeys(
        props,
        "state",
        "currentKeys",
        "searchResult",
        "hitTest",
        "maxItemsCount",
        "toolBarNode",
        "parentItemsNode",
        "statusBarNode",
        "afterRender"
      )
    },
    props.toolBarNode ? props.toolBarNode(state, localState, toolBarNode) : toolBarNode,
    props.parentItemsNode ? props.parentItemsNode(state, localState, parentItemsNode) : parentItemsNode,
    itemsNode,
    props.statusBarNode ? props.statusBarNode(state, localState, statusBarNode) : statusBarNode
  );
  return afterRender ? afterRender(state, localState, vnode) : vnode;
};
const _isStart = /* @__PURE__ */ Symbol("RAFTask.isStart");
class RAFTask {
  // ---------- ---------- ----------
  // field
  // ---------- ---------- ----------
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
  // ---------- ---------- ----------
  // constructor
  // ---------- ---------- ----------
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
  // ---------- ---------- ----------
  // getter
  // ---------- ---------- ----------
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
  // ---------- ---------- ----------
  // setter
  // ---------- ---------- ----------
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
  // ---------- ---------- ----------
  // private method: _isStart
  // ---------- ---------- ----------
  /**
   * アクションを開始して良いか判定する
   * 現在時間等のアップデートも同時に行われる
   * subscription_RAFManager でのみ使用される
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
  // ---------- ---------- ----------
  // method: clone
  // ---------- ---------- ----------
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
        items.map((_, i) => li(
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
const param = {
  page: "0",
  selected: [],
  tasks: [],
  carousel: {
    pageNumber: 0
  },
  navigator: {
    finder_current: void 0,
    search_current: void 0
  }
};
addEventListener("load", () => {
  const tasks = ["tasks"];
  const page = ["page"];
  const navigator_finder = ["navigator", "finder_current"];
  const navigator_search = ["navigator", "search_current"];
  const action_initCarousel = (state) => {
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
      effect_InitCarousel(tasks, param1),
      effect_InitCarousel(tasks, param2),
      effect_InitCarousel(tasks, param3)
    ];
  };
  const action_initNavigator = (state) => {
    const effect_loadJson = async (dispatch) => {
      const json = await fetch("isYoshihiro.json").then((data) => {
        if (!data.ok) throw new Error("error loadJson");
        return data.json();
      });
      const getEntries = (data, depth) => {
        const result = [];
        Object.keys(data).forEach((key) => {
          const obj = data[key];
          const isNode = Object.keys(obj).some((key2) => typeof obj[key2] === "object" && !Array.isArray(obj[key2]));
          result.push({
            name: key,
            data: obj,
            isNode
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
      dispatch((state2) => setValue(
        setValue(state2, navigator_search, rootItem),
        navigator_finder,
        rootItem
      ));
    };
    return [
      state,
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
    )))), /* @__PURE__ */ h("main", null, /* @__PURE__ */ h(
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
      /* @__PURE__ */ h("h3", null, "#sample_navigatorFinder + NavigatorSerch"),
      /* @__PURE__ */ h(
        NavigatorFinder,
        {
          state,
          id: "navigator_finder",
          currentKeys: navigator_finder,
          class: "navigator_finder_simple",
          plugIn: (state2, localState) => {
            const keys = localState.searchText.trim().replace(/[ 　]+/g, " ").replace(/^ | $/g, "").split(" ").filter(Boolean);
            return [
              /* @__PURE__ */ h(
                NavigatorSearch,
                {
                  state: state2,
                  id: "navigator_search",
                  currentKeys: ["navigator", "search_current"],
                  searchResult: (item, depth) => /* @__PURE__ */ h(
                    "div",
                    {
                      onclick: (state3) => {
                        const isDirectory = item.children !== void 0;
                        return setValue(
                          state3,
                          ["navigator", "finder_current"],
                          isDirectory ? item : item.parent
                        );
                      }
                    },
                    /* @__PURE__ */ h("div", null, /* @__PURE__ */ h("span", null, item.children === void 0 ? "" : "[D]"), /* @__PURE__ */ h("span", null, `(${depth})`), /* @__PURE__ */ h("span", null, item.name))
                  ),
                  hitTest: (item) => {
                    if (keys.length === 0) return true;
                    return keys.every((key) => item.name.indexOf(key) !== -1);
                  },
                  maxItemsCount: 10
                }
              )
            ];
          }
        }
      )
    ))),
    node: document.getElementById("app"),
    init: param,
    subscriptions: (state) => [
      subscription_RAFManager(state, tasks)
    ]
  });
});
