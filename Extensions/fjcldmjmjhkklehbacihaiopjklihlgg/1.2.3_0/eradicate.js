(function () {
    'use strict';

    const removeNode = (node) => node.parentNode.removeChild(node);
    const removeChildren = (node) => {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    };
    const remove = (elements) => {
        document.querySelectorAll(elements.toRemove.join(',')).forEach(removeNode);
        document.querySelectorAll(elements.toEmpty.join(',')).forEach(removeChildren);
    };

    const handleError = e => {
        console.error('-------------------------------------');
        console.error('Something went wrong loading News Feed Eradicator. Please take a screenshot of these details:');
        console.error(e);
        console.error(e.stack);
        console.error('-------------------------------------');
    };

    function loadSettings(callback) {
        if (typeof browser !== 'undefined') {
            browser.storage.sync
                .get(null)
                .then(data => {
                callback(data);
            })
                .catch(e => console.error(e));
        }
        else if (typeof chrome !== 'undefined') {
            chrome.storage.sync.get(null, data => {
                callback(data);
            });
        }
        else {
            throw new Error('Could not find WebExtension API');
        }
    }
    function saveSettings(data) {
        chrome.storage.sync.set(data);
    }

    function symbolObservablePonyfill(root) {
    	var result;
    	var Symbol = root.Symbol;

    	if (typeof Symbol === 'function') {
    		if (Symbol.observable) {
    			result = Symbol.observable;
    		} else {
    			result = Symbol('observable');
    			Symbol.observable = result;
    		}
    	} else {
    		result = '@@observable';
    	}

    	return result;
    }

    /* global window */

    var root;

    if (typeof self !== 'undefined') {
      root = self;
    } else if (typeof window !== 'undefined') {
      root = window;
    } else if (typeof global !== 'undefined') {
      root = global;
    } else if (typeof module !== 'undefined') {
      root = module;
    } else {
      root = Function('return this')();
    }

    var result = symbolObservablePonyfill(root);

    /**
     * These are private action types reserved by Redux.
     * For any unknown actions, you must return the current state.
     * If the current state is undefined, you must return the initial state.
     * Do not reference these action types directly in your code.
     */
    var randomString = function randomString() {
      return Math.random().toString(36).substring(7).split('').join('.');
    };

    var ActionTypes = {
      INIT: "@@redux/INIT" + randomString(),
      REPLACE: "@@redux/REPLACE" + randomString(),
      PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
        return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
      }
    };

    /**
     * @param {any} obj The object to inspect.
     * @returns {boolean} True if the argument appears to be a plain object.
     */
    function isPlainObject(obj) {
      if (typeof obj !== 'object' || obj === null) return false;
      var proto = obj;

      while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
      }

      return Object.getPrototypeOf(obj) === proto;
    }

    /**
     * Creates a Redux store that holds the state tree.
     * The only way to change the data in the store is to call `dispatch()` on it.
     *
     * There should only be a single store in your app. To specify how different
     * parts of the state tree respond to actions, you may combine several reducers
     * into a single reducer function by using `combineReducers`.
     *
     * @param {Function} reducer A function that returns the next state tree, given
     * the current state tree and the action to handle.
     *
     * @param {any} [preloadedState] The initial state. You may optionally specify it
     * to hydrate the state from the server in universal apps, or to restore a
     * previously serialized user session.
     * If you use `combineReducers` to produce the root reducer function, this must be
     * an object with the same shape as `combineReducers` keys.
     *
     * @param {Function} [enhancer] The store enhancer. You may optionally specify it
     * to enhance the store with third-party capabilities such as middleware,
     * time travel, persistence, etc. The only store enhancer that ships with Redux
     * is `applyMiddleware()`.
     *
     * @returns {Store} A Redux store that lets you read the state, dispatch actions
     * and subscribe to changes.
     */

    function createStore(reducer, preloadedState, enhancer) {
      var _ref2;

      if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
        throw new Error('It looks like you are passing several store enhancers to ' + 'createStore(). This is not supported. Instead, compose them ' + 'together to a single function.');
      }

      if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
        enhancer = preloadedState;
        preloadedState = undefined;
      }

      if (typeof enhancer !== 'undefined') {
        if (typeof enhancer !== 'function') {
          throw new Error('Expected the enhancer to be a function.');
        }

        return enhancer(createStore)(reducer, preloadedState);
      }

      if (typeof reducer !== 'function') {
        throw new Error('Expected the reducer to be a function.');
      }

      var currentReducer = reducer;
      var currentState = preloadedState;
      var currentListeners = [];
      var nextListeners = currentListeners;
      var isDispatching = false;
      /**
       * This makes a shallow copy of currentListeners so we can use
       * nextListeners as a temporary list while dispatching.
       *
       * This prevents any bugs around consumers calling
       * subscribe/unsubscribe in the middle of a dispatch.
       */

      function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
          nextListeners = currentListeners.slice();
        }
      }
      /**
       * Reads the state tree managed by the store.
       *
       * @returns {any} The current state tree of your application.
       */


      function getState() {
        if (isDispatching) {
          throw new Error('You may not call store.getState() while the reducer is executing. ' + 'The reducer has already received the state as an argument. ' + 'Pass it down from the top reducer instead of reading it from the store.');
        }

        return currentState;
      }
      /**
       * Adds a change listener. It will be called any time an action is dispatched,
       * and some part of the state tree may potentially have changed. You may then
       * call `getState()` to read the current state tree inside the callback.
       *
       * You may call `dispatch()` from a change listener, with the following
       * caveats:
       *
       * 1. The subscriptions are snapshotted just before every `dispatch()` call.
       * If you subscribe or unsubscribe while the listeners are being invoked, this
       * will not have any effect on the `dispatch()` that is currently in progress.
       * However, the next `dispatch()` call, whether nested or not, will use a more
       * recent snapshot of the subscription list.
       *
       * 2. The listener should not expect to see all state changes, as the state
       * might have been updated multiple times during a nested `dispatch()` before
       * the listener is called. It is, however, guaranteed that all subscribers
       * registered before the `dispatch()` started will be called with the latest
       * state by the time it exits.
       *
       * @param {Function} listener A callback to be invoked on every dispatch.
       * @returns {Function} A function to remove this change listener.
       */


      function subscribe(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Expected the listener to be a function.');
        }

        if (isDispatching) {
          throw new Error('You may not call store.subscribe() while the reducer is executing. ' + 'If you would like to be notified after the store has been updated, subscribe from a ' + 'component and invoke store.getState() in the callback to access the latest state. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.');
        }

        var isSubscribed = true;
        ensureCanMutateNextListeners();
        nextListeners.push(listener);
        return function unsubscribe() {
          if (!isSubscribed) {
            return;
          }

          if (isDispatching) {
            throw new Error('You may not unsubscribe from a store listener while the reducer is executing. ' + 'See https://redux.js.org/api-reference/store#subscribelistener for more details.');
          }

          isSubscribed = false;
          ensureCanMutateNextListeners();
          var index = nextListeners.indexOf(listener);
          nextListeners.splice(index, 1);
          currentListeners = null;
        };
      }
      /**
       * Dispatches an action. It is the only way to trigger a state change.
       *
       * The `reducer` function, used to create the store, will be called with the
       * current state tree and the given `action`. Its return value will
       * be considered the **next** state of the tree, and the change listeners
       * will be notified.
       *
       * The base implementation only supports plain object actions. If you want to
       * dispatch a Promise, an Observable, a thunk, or something else, you need to
       * wrap your store creating function into the corresponding middleware. For
       * example, see the documentation for the `redux-thunk` package. Even the
       * middleware will eventually dispatch plain object actions using this method.
       *
       * @param {Object} action A plain object representing “what changed”. It is
       * a good idea to keep actions serializable so you can record and replay user
       * sessions, or use the time travelling `redux-devtools`. An action must have
       * a `type` property which may not be `undefined`. It is a good idea to use
       * string constants for action types.
       *
       * @returns {Object} For convenience, the same action object you dispatched.
       *
       * Note that, if you use a custom middleware, it may wrap `dispatch()` to
       * return something else (for example, a Promise you can await).
       */


      function dispatch(action) {
        if (!isPlainObject(action)) {
          throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
        }

        if (typeof action.type === 'undefined') {
          throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
        }

        if (isDispatching) {
          throw new Error('Reducers may not dispatch actions.');
        }

        try {
          isDispatching = true;
          currentState = currentReducer(currentState, action);
        } finally {
          isDispatching = false;
        }

        var listeners = currentListeners = nextListeners;

        for (var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          listener();
        }

        return action;
      }
      /**
       * Replaces the reducer currently used by the store to calculate the state.
       *
       * You might need this if your app implements code splitting and you want to
       * load some of the reducers dynamically. You might also need this if you
       * implement a hot reloading mechanism for Redux.
       *
       * @param {Function} nextReducer The reducer for the store to use instead.
       * @returns {void}
       */


      function replaceReducer(nextReducer) {
        if (typeof nextReducer !== 'function') {
          throw new Error('Expected the nextReducer to be a function.');
        }

        currentReducer = nextReducer; // This action has a similiar effect to ActionTypes.INIT.
        // Any reducers that existed in both the new and old rootReducer
        // will receive the previous state. This effectively populates
        // the new state tree with any relevant data from the old one.

        dispatch({
          type: ActionTypes.REPLACE
        });
      }
      /**
       * Interoperability point for observable/reactive libraries.
       * @returns {observable} A minimal observable of state changes.
       * For more information, see the observable proposal:
       * https://github.com/tc39/proposal-observable
       */


      function observable() {
        var _ref;

        var outerSubscribe = subscribe;
        return _ref = {
          /**
           * The minimal observable subscription method.
           * @param {Object} observer Any object that can be used as an observer.
           * The observer object should have a `next` method.
           * @returns {subscription} An object with an `unsubscribe` method that can
           * be used to unsubscribe the observable from the store, and prevent further
           * emission of values from the observable.
           */
          subscribe: function subscribe(observer) {
            if (typeof observer !== 'object' || observer === null) {
              throw new TypeError('Expected the observer to be an object.');
            }

            function observeState() {
              if (observer.next) {
                observer.next(getState());
              }
            }

            observeState();
            var unsubscribe = outerSubscribe(observeState);
            return {
              unsubscribe: unsubscribe
            };
          }
        }, _ref[result] = function () {
          return this;
        }, _ref;
      } // When a store is created, an "INIT" action is dispatched so that every
      // reducer returns their initial state. This effectively populates
      // the initial state tree.


      dispatch({
        type: ActionTypes.INIT
      });
      return _ref2 = {
        dispatch: dispatch,
        subscribe: subscribe,
        getState: getState,
        replaceReducer: replaceReducer
      }, _ref2[result] = observable, _ref2;
    }

    function getUndefinedStateErrorMessage(key, action) {
      var actionType = action && action.type;
      var actionDescription = actionType && "action \"" + String(actionType) + "\"" || 'an action';
      return "Given " + actionDescription + ", reducer \"" + key + "\" returned undefined. " + "To ignore an action, you must explicitly return the previous state. " + "If you want this reducer to hold no value, you can return null instead of undefined.";
    }

    function assertReducerShape(reducers) {
      Object.keys(reducers).forEach(function (key) {
        var reducer = reducers[key];
        var initialState = reducer(undefined, {
          type: ActionTypes.INIT
        });

        if (typeof initialState === 'undefined') {
          throw new Error("Reducer \"" + key + "\" returned undefined during initialization. " + "If the state passed to the reducer is undefined, you must " + "explicitly return the initial state. The initial state may " + "not be undefined. If you don't want to set a value for this reducer, " + "you can use null instead of undefined.");
        }

        if (typeof reducer(undefined, {
          type: ActionTypes.PROBE_UNKNOWN_ACTION()
        }) === 'undefined') {
          throw new Error("Reducer \"" + key + "\" returned undefined when probed with a random type. " + ("Don't try to handle " + ActionTypes.INIT + " or other actions in \"redux/*\" ") + "namespace. They are considered private. Instead, you must return the " + "current state for any unknown actions, unless it is undefined, " + "in which case you must return the initial state, regardless of the " + "action type. The initial state may not be undefined, but can be null.");
        }
      });
    }
    /**
     * Turns an object whose values are different reducer functions, into a single
     * reducer function. It will call every child reducer, and gather their results
     * into a single state object, whose keys correspond to the keys of the passed
     * reducer functions.
     *
     * @param {Object} reducers An object whose values correspond to different
     * reducer functions that need to be combined into one. One handy way to obtain
     * it is to use ES6 `import * as reducers` syntax. The reducers may never return
     * undefined for any action. Instead, they should return their initial state
     * if the state passed to them was undefined, and the current state for any
     * unrecognized action.
     *
     * @returns {Function} A reducer function that invokes every reducer inside the
     * passed object, and builds a state object with the same shape.
     */


    function combineReducers(reducers) {
      var reducerKeys = Object.keys(reducers);
      var finalReducers = {};

      for (var i = 0; i < reducerKeys.length; i++) {
        var key = reducerKeys[i];

        if (typeof reducers[key] === 'function') {
          finalReducers[key] = reducers[key];
        }
      }

      var finalReducerKeys = Object.keys(finalReducers); // This is used to make sure we don't warn about the same

      var shapeAssertionError;

      try {
        assertReducerShape(finalReducers);
      } catch (e) {
        shapeAssertionError = e;
      }

      return function combination(state, action) {
        if (state === void 0) {
          state = {};
        }

        if (shapeAssertionError) {
          throw shapeAssertionError;
        }

        var hasChanged = false;
        var nextState = {};

        for (var _i = 0; _i < finalReducerKeys.length; _i++) {
          var _key = finalReducerKeys[_i];
          var reducer = finalReducers[_key];
          var previousStateForKey = state[_key];
          var nextStateForKey = reducer(previousStateForKey, action);

          if (typeof nextStateForKey === 'undefined') {
            var errorMessage = getUndefinedStateErrorMessage(_key, action);
            throw new Error(errorMessage);
          }

          nextState[_key] = nextStateForKey;
          hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }

        hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
        return hasChanged ? nextState : state;
      };
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        keys.push.apply(keys, Object.getOwnPropertySymbols(object));
      }

      if (enumerableOnly) keys = keys.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys(source, true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(source).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    /**
     * Composes single-argument functions from right to left. The rightmost
     * function can take multiple arguments as it provides the signature for
     * the resulting composite function.
     *
     * @param {...Function} funcs The functions to compose.
     * @returns {Function} A function obtained by composing the argument functions
     * from right to left. For example, compose(f, g, h) is identical to doing
     * (...args) => f(g(h(...args))).
     */
    function compose() {
      for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
        funcs[_key] = arguments[_key];
      }

      if (funcs.length === 0) {
        return function (arg) {
          return arg;
        };
      }

      if (funcs.length === 1) {
        return funcs[0];
      }

      return funcs.reduce(function (a, b) {
        return function () {
          return a(b.apply(void 0, arguments));
        };
      });
    }

    /**
     * Creates a store enhancer that applies middleware to the dispatch method
     * of the Redux store. This is handy for a variety of tasks, such as expressing
     * asynchronous actions in a concise manner, or logging every action payload.
     *
     * See `redux-thunk` package as an example of the Redux middleware.
     *
     * Because middleware is potentially asynchronous, this should be the first
     * store enhancer in the composition chain.
     *
     * Note that each middleware will be given the `dispatch` and `getState` functions
     * as named arguments.
     *
     * @param {...Function} middlewares The middleware chain to be applied.
     * @returns {Function} A store enhancer applying the middleware.
     */

    function applyMiddleware() {
      for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
        middlewares[_key] = arguments[_key];
      }

      return function (createStore) {
        return function () {
          var store = createStore.apply(void 0, arguments);

          var _dispatch = function dispatch() {
            throw new Error('Dispatching while constructing your middleware is not allowed. ' + 'Other middleware would not be applied to this dispatch.');
          };

          var middlewareAPI = {
            getState: store.getState,
            dispatch: function dispatch() {
              return _dispatch.apply(void 0, arguments);
            }
          };
          var chain = middlewares.map(function (middleware) {
            return middleware(middlewareAPI);
          });
          _dispatch = compose.apply(void 0, chain)(store.dispatch);
          return _objectSpread2({}, store, {
            dispatch: _dispatch
          });
        };
      };
    }

    function createThunkMiddleware(extraArgument) {
      return function (_ref) {
        var dispatch = _ref.dispatch,
            getState = _ref.getState;
        return function (next) {
          return function (action) {
            if (typeof action === 'function') {
              return action(dispatch, getState, extraArgument);
            }

            return next(action);
          };
        };
      };
    }

    var thunk = createThunkMiddleware();
    thunk.withExtraArgument = createThunkMiddleware;

    var config = {
        newFeatureIncrement: 1,
    };

    const BuiltinQuotes = [
        {
            id: 1,
            text: 'I have just three things to teach: simplicity, patience, compassion. These three are your greatest treasures.',
            source: 'Lao Tzu',
        },
        {
            id: 2,
            text: "Do today what others won't and achieve tomorrow what others can't.",
            source: 'Jerry Rice',
        },
        {
            id: 3,
            text: 'In character, in manner, in style, in all things, the supreme excellence is simplicity.',
            source: 'Henry Wadsworth Longfellow',
        },
        {
            id: 4,
            text: "If we don't discipline ourselves, the world will do it for us.",
            source: 'William Feather',
        },
        {
            id: 5,
            text: 'Rule your mind or it will rule you.',
            source: 'Horace',
        },
        {
            id: 6,
            text: 'All that we are is the result of what we have thought.',
            source: 'Buddha',
        },
        {
            id: 7,
            text: 'Doing just a little bit during the time we have available puts you that much further ahead than if you took no action at all.',
            source: "Pulsifer, Take Action; Don't Procrastinate",
        },
        {
            id: 8,
            text: 'Never leave that till tomorrow which you can do today.',
            source: 'Benjamin Franklin',
        },
        {
            id: 9,
            text: "Procrastination is like a credit card: it's a lot of fun until you get the bill.",
            source: 'Christopher Parker',
        },
        {
            id: 10,
            text: 'Someday is not a day of the week.',
            source: 'Author Unknown',
        },
        {
            id: 11,
            text: 'Tomorrow is often the busiest day of the week.',
            source: 'Spanish Proverb',
        },
        {
            id: 12,
            text: "I can accept failure, everyone fails at something. But I can't accept not trying.",
            source: 'Michael Jordan',
        },
        {
            id: 13,
            text: 'There’s a myth that time is money. In fact, time is more precious than money. It’s a nonrenewable resource. Once you’ve spent it, and if you’ve spent it badly, it’s gone forever.',
            source: 'Neil A. Fiore',
        },
        {
            id: 14,
            text: 'Nothing can stop the man with the right mental attitude from achieving his goal; nothing on earth can help the man with the wrong mental attitude.',
            source: 'Thomas Jefferson',
        },
        {
            id: 15,
            text: 'There is only one success--to be able to spend your life in your own way.',
            source: 'Christopher Morley',
        },
        {
            id: 16,
            text: 'Success is the good fortune that comes from aspiration, desperation, perspiration and inspiration.',
            source: 'Evan Esar',
        },
        {
            id: 17,
            text: 'We are still masters of our fate. We are still captains of our souls.',
            source: 'Winston Churchill',
        },
        {
            id: 18,
            text: 'Our truest life is when we are in dreams awake.',
            source: 'Henry David Thoreau',
        },
        {
            id: 19,
            text: 'The best way to make your dreams come true is to wake up.',
            source: 'Paul Valery',
        },
        {
            id: 20,
            text: 'Life without endeavor is like entering a jewel mine and coming out with empty hands.',
            source: 'Japanese Proverb',
        },
        {
            id: 21,
            text: 'Happiness does not consist in pastimes and amusements but in virtuous activities.',
            source: 'Aristotle',
        },
        {
            id: 22,
            text: 'By constant self-discipline and self-control, you can develop greatness of character.',
            source: 'Grenville Kleiser',
        },
        {
            id: 23,
            text: 'The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.',
            source: 'Vince Lombardi Jr.',
        },
        {
            id: 24,
            text: 'At the end of the day, let there be no excuses, no explanations, no regrets.',
            source: 'Steve Maraboli',
        },
        {
            id: 25,
            text: 'Inaction will cause a man to sink into the slough of despond and vanish without a trace.',
            source: 'Farley Mowat',
        },
        {
            id: 26,
            text: 'True freedom is impossible without a mind made free by discipline.',
            source: 'Mortimer J. Adler',
        },
        {
            id: 27,
            text: 'The most powerful control we can ever attain, is to be in control of ourselves.',
            source: 'Chris Page',
        },
        {
            id: 28,
            text: 'Idleness is only the refuge of weak minds, and the holiday of fools.',
            source: 'Philip Dormer Stanhope',
        },
        {
            id: 29,
            text: "This is your life and it's ending one minute at a time.",
            source: 'Tyler Durden, Fight Club',
        },
        {
            id: 30,
            text: 'You create opportunities by performing, not complaining.',
            source: 'Muriel Siebert',
        },
        {
            id: 31,
            text: 'Great achievement is usually born of great sacrifice, and is never the result of selfishness.',
            source: 'Napoleon Hill',
        },
        {
            id: 32,
            text: "Whether you think you can, or you think you can't, you're right.",
            source: 'Henry Ford',
        },
        {
            id: 33,
            text: 'Even if I knew that tomorrow the world would go to pieces, I would still plant my apple tree.',
            source: 'Martin Luther',
        },
        {
            id: 34,
            text: 'Great acts are made up of small deeds.',
            source: 'Lao Tzu',
        },
        {
            id: 35,
            text: 'The flame that burns Twice as bright burns half as long.',
            source: 'Lao Tzu',
        },
        {
            id: 36,
            text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.',
            source: 'Antoine de Saint-Exupery',
        },
        {
            id: 37,
            text: "If you can't do great things, do small things in a great way.",
            source: 'Napoleon Hill',
        },
        {
            id: 38,
            text: 'When I let go of what I am, I become what I might be.',
            source: 'Lao Tzu',
        },
        {
            id: 39,
            text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.',
            source: 'Ralph Waldo Emerson',
        },
        {
            id: 40,
            text: 'Well done is better than well said.',
            source: 'Benjamin Franklin',
        },
        {
            id: 41,
            text: 'Whatever you think the world is withholding from you, you are withholding from the world.',
            source: 'Ekhart Tolle',
        },
        {
            id: 42,
            text: 'Muddy water is best cleared by leaving it alone.',
            source: 'Alan Watts',
        },
        {
            id: 43,
            text: 'Do, or do not. There is no try.',
            source: 'Yoda',
        },
        {
            id: 44,
            text: 'The superior man is modest in his speech, but exceeds in his actions.',
            source: 'Confucius',
        },
        {
            id: 45,
            text: 'Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.',
            source: 'Helen Keller',
        },
        {
            id: 46,
            text: 'We must believe that we are gifted for something, and that this thing, at whatever cost, must be attained.',
            source: 'Marie Curie',
        },
        {
            id: 47,
            text: 'If you look at what you have in life, you’ll always have more. If you look at what you don’t have in life, you’ll never have enough.',
            source: 'Oprah Winfrey',
        },
        {
            id: 48,
            text: 'You may encounter many defeats, but you must not be defeated. In fact, it may be necessary to encounter the defeats, so you can know who you are, what you can rise from, how you can still come out of it.',
            source: 'Maya Angelou',
        },
        {
            id: 49,
            text: 'We need to start work with the idea that we’re going to learn every day. I learn, even at my position, every single day.',
            source: 'Chanda Kochhar',
        },
        {
            id: 50,
            text: 'There are two kinds of people, those who do the work and those who take the credit. Try to be in the first group; there is less competition there.',
            source: 'Indira Gandhi',
        },
        {
            id: 51,
            text: 'You can’t be that kid standing at the top of the waterslide, overthinking it. You have to go down the chute.',
            source: 'Tina Fey',
        },
        {
            id: 52,
            text: 'Above all, be the heroine of your life, not the victim.',
            source: 'Nora Ephron',
        },
        {
            id: 53,
            text: 'Learn from the mistakes of others. You can’t live long enough to make them all yourself.',
            source: 'Eleanor Roosevelt',
        },
        {
            id: 54,
            text: 'What you do makes a difference, and you have to decide what kind of difference you want to make.',
            source: 'Jane Goodall',
        },
        {
            id: 55,
            text: 'One of the secrets to staying young is to always do things you don’t know how to do, to keep learning.',
            source: 'Ruth Reichl',
        },
        {
            id: 56,
            text: 'If you don’t risk anything, you risk even more.',
            source: 'Erica Jong',
        },
        {
            id: 57,
            text: 'When the whole world is silent, even one voice becomes powerful.',
            source: 'Malala Yousafzai',
        },
        {
            id: 58,
            text: 'The most common way people give up their power is by thinking they don’t have any.',
            source: 'Alice Walker',
        },
        {
            id: 59,
            text: 'My philosophy is that not only are you responsible for your life, but doing the best at this moment puts you in the best place for the next moment.',
            source: 'Oprah Winfrey',
        },
        {
            id: 60,
            text: 'Don’t be intimidated by what you don’t know. That can be your greatest strength and ensure that you do things differently from everyone else.',
            source: 'Sara Blakely',
        },
        {
            id: 61,
            text: 'If I had to live my life again, I’d make the same mistakes, only sooner.',
            source: 'Tallulah Bankhead',
        },
        {
            id: 62,
            text: 'Never limit yourself because of others’ limited imagination; never limit others because of your own limited imagination.',
            source: 'Mae C. Jemison',
        },
        {
            id: 63,
            text: 'If you obey all the rules, you miss all the fun.',
            source: 'Katharine Hepburn',
        },
        {
            id: 64,
            text: 'Life shrinks or expands in proportion to one’s courage.',
            source: 'Anaïs Nin',
        },
        {
            id: 65,
            text: 'Avoiding danger is no safer in the long run than outright exposure. The fearful are caught as often as the bold.',
            source: 'Helen Keller',
        },
        {
            id: 66,
            text: 'How wonderful it is that nobody need wait a single moment before beginning to improve the world.',
            source: 'Anne Frank',
        },
        {
            id: 67,
            text: 'So often people are working hard at the wrong thing. Working on the right thing is probably more important than working hard.',
            source: 'Caterina Fake',
        },
        {
            id: 68,
            text: 'There are still many causes worth sacrificing for, so much history yet to be made.',
            source: 'Michelle Obama',
        },
        {
            id: 69,
            text: 'Nothing is impossible; the word itself says ‘I’m possible’!',
            source: 'Audrey Hepburn',
        },
        {
            id: 70,
            text: 'You only live once, but if you do it right, once is enough.',
            source: 'Mae West',
        },
    ];

    function areNewFeaturesAvailable(state) {
        return config.newFeatureIncrement > state.featureIncrement;
    }
    function getBuiltinQuotes(state) {
        if (!state.builtinQuotesEnabled)
            return [];
        return BuiltinQuotes.filter(quote => state.hiddenBuiltinQuotes.indexOf(quote.id) === -1);
    }
    function currentQuote(state) {
        const emptyQuote = { id: null, text: 'No quotes found!', source: '' };
        if (state.currentQuoteID == null)
            return emptyQuote;
        if (state.isCurrentQuoteCustom) {
            return (state.customQuotes.find(quote => quote.id === state.currentQuoteID) ||
                emptyQuote);
        }
        else {
            return (BuiltinQuotes.find(quote => quote.id === state.currentQuoteID) ||
                emptyQuote);
        }
    }

    var ActionTypes$1;
    (function (ActionTypes) {
        ActionTypes[ActionTypes["TOGGLE_SHOW_QUOTES"] = 'TOGGLE_SHOW_QUOTES'] = "TOGGLE_SHOW_QUOTES";
        ActionTypes[ActionTypes["TOGGLE_BUILTIN_QUOTES"] = 'TOGGLE_BUILTIN_QUOTES'] = "TOGGLE_BUILTIN_QUOTES";
        ActionTypes[ActionTypes["SELECT_NEW_QUOTE"] = 'SELECT_NEW_QUOTE'] = "SELECT_NEW_QUOTE";
        ActionTypes[ActionTypes["HIDE_QUOTE"] = 'HIDE_QUOTE'] = "HIDE_QUOTE";
        ActionTypes[ActionTypes["DELETE_QUOTE"] = 'DELETE_QUOTE'] = "DELETE_QUOTE";
        ActionTypes[ActionTypes["ADD_QUOTE"] = 'ADD_QUOTE'] = "ADD_QUOTE";
        ActionTypes[ActionTypes["ADD_QUOTES_BULK"] = 'ADD_QUOTES_BULK'] = "ADD_QUOTES_BULK";
        ActionTypes[ActionTypes["RESET_HIDDEN_QUOTES"] = 'RESET_HIDDEN_QUOTES'] = "RESET_HIDDEN_QUOTES";
    })(ActionTypes$1 || (ActionTypes$1 = {}));
    var Actions = ActionTypes$1;
    function generateID() {
        let key = '';
        while (key.length < 16) {
            key += Math.random()
                .toString(16)
                .substr(2);
        }
        return key.substr(0, 16);
    }
    function hideInfoPanel() {
        return {
            type: 'INFO_PANEL_SHOW',
            show: 'HIDE',
        };
    }
    function showInfoPanel() {
        return {
            type: 'INFO_PANEL_SHOW',
            show: 'SHOW',
        };
    }
    function toggleShowQuotes() {
        return {
            type: ActionTypes$1.TOGGLE_SHOW_QUOTES,
        };
    }
    function toggleBuiltinQuotes() {
        return dispatch => {
            dispatch({
                type: ActionTypes$1.TOGGLE_BUILTIN_QUOTES,
            });
            dispatch(selectNewQuote());
        };
    }
    function addQuote(text, source) {
        const id = generateID();
        return dispatch => {
            dispatch({
                type: ActionTypes$1.ADD_QUOTE,
                id,
                text,
                source,
            });
            dispatch(cancelEditing());
        };
    }
    function resetHiddenQuotes() {
        return {
            type: ActionTypes$1.RESET_HIDDEN_QUOTES,
        };
    }
    function removeCurrentQuote() {
        return (dispatch, getState) => {
            const state = getState();
            if (state.isCurrentQuoteCustom) {
                dispatch({
                    type: ActionTypes$1.DELETE_QUOTE,
                    id: state.currentQuoteID,
                });
            }
            else {
                dispatch({
                    type: ActionTypes$1.HIDE_QUOTE,
                    id: state.currentQuoteID,
                });
            }
            dispatch(selectNewQuote());
        };
    }
    function selectNewQuote() {
        return (dispatch, getState) => {
            const state = getState();
            const builtinQuotes = getBuiltinQuotes(state);
            const customQuotes = state.customQuotes;
            const allQuotes = builtinQuotes.concat(customQuotes);
            if (allQuotes.length < 1) {
                return dispatch({
                    type: ActionTypes$1.SELECT_NEW_QUOTE,
                    isCustom: false,
                    id: null,
                });
            }
            const quoteIndex = Math.floor(Math.random() * allQuotes.length);
            dispatch({
                type: ActionTypes$1.SELECT_NEW_QUOTE,
                isCustom: quoteIndex >= builtinQuotes.length,
                id: allQuotes[quoteIndex].id,
            });
        };
    }
    function setQuoteText(text) {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'SET_TEXT', text: text },
        };
    }
    function setQuoteSource(source) {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'SET_SOURCE', source },
        };
    }
    function startEditing() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'START' },
        };
    }
    function cancelEditing() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'CANCEL' },
        };
    }
    const menuHide = () => ({
        type: 'QUOTE_MENU_SHOW',
        show: 'HIDE',
    });
    const menuToggle = () => ({
        type: 'QUOTE_MENU_SHOW',
        show: 'TOGGLE',
    });
    function toggleBulkEdit() {
        return {
            type: 'QUOTE_EDIT',
            action: { type: 'TOGGLE_BULK' },
        };
    }
    function addQuotesBulk(text) {
        return dispatch => {
            const lines = text.split('\n');
            const quotes = [];
            for (var lineCount = 0; lineCount < lines.length; lineCount++) {
                const line = lines[lineCount];
                const quote = line.split('~');
                const trimmedQuote = [];
                if (quote.length === 0 || quote[0].trim() === '') ;
                else if (quote.length !== 2) {
                    return dispatch({
                        type: 'PARSE_ERROR',
                        message: `Invalid format on line ${(lineCount + 1).toString()}: \"${quote}\"`,
                    });
                }
                else {
                    quote.forEach(field => trimmedQuote.push(field.trim()));
                    quotes.push(trimmedQuote);
                }
            }
            quotes.forEach(trimmedQuote => {
                dispatch({
                    type: ActionTypes$1.ADD_QUOTE,
                    id: generateID(),
                    text: trimmedQuote[0],
                    source: trimmedQuote[1],
                });
            });
            dispatch(cancelEditing());
        };
    }

    function showQuotes(state = true, action) {
        switch (action.type) {
            case Actions.TOGGLE_SHOW_QUOTES:
                return !state;
        }
        return state;
    }
    function builtinQuotesEnabled(state = true, action) {
        switch (action.type) {
            case Actions.TOGGLE_BUILTIN_QUOTES:
                return !state;
        }
        return state;
    }
    function showInfoPanel$1(state = false, action) {
        switch (action.type) {
            case 'INFO_PANEL_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return true;
                    case 'HIDE':
                        return false;
                    case 'TOGGLE':
                        return !state;
                }
        }
        return state;
    }
    function featureIncrement(state = 0, action) {
        switch (action.type) {
            case 'INFO_PANEL_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return config.newFeatureIncrement;
                }
        }
        return state;
    }
    function isCurrentQuoteCustom(state = null, action) {
        switch (action.type) {
            case Actions.SELECT_NEW_QUOTE:
                return action.isCustom;
            case Actions.ADD_QUOTE:
                return true;
        }
        return state;
    }
    function currentQuoteID(state = null, action) {
        switch (action.type) {
            case Actions.SELECT_NEW_QUOTE:
                return action.id;
            case Actions.ADD_QUOTE:
                return action.id;
        }
        return state;
    }
    function hiddenBuiltinQuotes(state = [], action) {
        switch (action.type) {
            case Actions.HIDE_QUOTE:
                if (action.id == null)
                    return state;
                return state.concat([action.id]);
            case Actions.RESET_HIDDEN_QUOTES:
                return [];
        }
        return state;
    }
    function customQuotes(state = [], action) {
        switch (action.type) {
            case Actions.ADD_QUOTE:
                return state.concat([
                    {
                        id: action.id,
                        text: action.text,
                        source: action.source,
                    },
                ]);
            case Actions.DELETE_QUOTE:
                if (action.id == null)
                    return state;
                return state.filter(quote => quote.id !== action.id);
        }
        return state;
    }
    const editingText = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return '';
                    case 'CANCEL':
                        return '';
                    case 'SET_TEXT':
                        return action.action.text;
                    case 'TOGGLE_BULK':
                        return '';
                }
        }
        return state;
    };
    const editingSource = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return '';
                    case 'CANCEL':
                        return '';
                    case 'SET_SOURCE':
                        return action.action.source;
                }
        }
        return state;
    };
    const isQuoteMenuVisible = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_MENU_SHOW':
                switch (action.show) {
                    case 'SHOW':
                        return true;
                    case 'HIDE':
                        return false;
                    case 'TOGGLE':
                        return !state;
                }
        }
        return state;
    };
    const isEditingQuote = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'START':
                        return true;
                    case 'CANCEL':
                        return false;
                }
        }
        return state;
    };
    const isEditingBulk = (state = false, action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'TOGGLE_BULK':
                        return !state;
                }
        }
        return state;
    };
    const error = (state = '', action) => {
        switch (action.type) {
            case 'QUOTE_EDIT':
                switch (action.action.type) {
                    case 'CANCEL':
                        return '';
                }
                return state;
            case 'PARSE_ERROR':
                return action.message;
        }
        return state;
    };
    var rootReducer = combineReducers({
        showQuotes,
        builtinQuotesEnabled,
        showInfoPanel: showInfoPanel$1,
        featureIncrement,
        isCurrentQuoteCustom,
        currentQuoteID,
        hiddenBuiltinQuotes,
        customQuotes,
        editingSource,
        editingText,
        isQuoteMenuVisible,
        isEditingQuote,
        isEditingBulk,
        error,
    });

    function saveSettings$1(state) {
        const data = {
            showQuotes: state.showQuotes,
            builtinQuotesEnabled: state.builtinQuotesEnabled,
            featureIncrement: state.featureIncrement,
            hiddenBuiltinQuotes: state.hiddenBuiltinQuotes,
            customQuotes: state.customQuotes,
        };
        saveSettings(data);
    }
    function createStore$1() {
        return new Promise(resolve => {
            loadSettings((initialState) => {
                const store = createStore(rootReducer, initialState, applyMiddleware(thunk));
                store.dispatch(selectNewQuote());
                store.subscribe(() => {
                    saveSettings$1(store.getState());
                });
                resolve(store);
            });
        });
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var vnode_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }
    exports.vnode = vnode;
    exports.default = vnode;

    });

    unwrapExports(vnode_1);
    var vnode_2 = vnode_1.vnode;

    var is = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }
    exports.primitive = primitive;

    });

    unwrapExports(is);
    var is_1 = is.array;
    var is_2 = is.primitive;

    var h_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    function addNS(data, children, sel) {
        data.ns = 'http://www.w3.org/2000/svg';
        if (sel !== 'foreignObject' && children !== undefined) {
            for (var i = 0; i < children.length; ++i) {
                var childData = children[i].data;
                if (childData !== undefined) {
                    addNS(childData, children[i].children, children[i].sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        var data = {}, children, text, i;
        if (c !== undefined) {
            data = b;
            if (is.array(c)) {
                children = c;
            }
            else if (is.primitive(c)) {
                text = c;
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined) {
            if (is.array(b)) {
                children = b;
            }
            else if (is.primitive(b)) {
                text = b;
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (is.primitive(children[i]))
                    children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
            (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
            addNS(data, children, sel);
        }
        return vnode_1.vnode(sel, data, children, text, undefined);
    }
    exports.h = h;
    exports.default = h;

    });

    unwrapExports(h_1);
    var h_2 = h_1.h;

    const QuoteEditor = (store) => {
        const state = store.getState();
        const text = state.editingText;
        const source = state.editingSource;
        const isEditingBulk = state.isEditingBulk;
        const errorMessage = state.error;
        const onChangeText = e => {
            store.dispatch(setQuoteText(e.target.value));
        };
        const onChangeSource = e => {
            store.dispatch(setQuoteSource(e.target.value));
        };
        const onSave = () => {
            if (!isEditingBulk) {
                store.dispatch(addQuote(text, source));
            }
            else {
                store.dispatch(addQuotesBulk(text));
            }
        };
        const onCancel = () => {
            store.dispatch(cancelEditing());
        };
        const onCheckboxToggle = e => {
            store.dispatch(toggleBulkEdit());
        };
        const quoteEditor = h_2('p.nfe-quote-text', [
            h_2('textarea.nfe-editor-quote', {
                props: {
                    placeholder: 'Quote',
                    value: text,
                    autoFocus: true,
                },
                on: {
                    change: onChangeText,
                },
            }),
        ]);
        const quoteEditorBulk = h_2('p.nfe-quote-text', [
            h_2('textarea.nfe-editor-quote-bulk', {
                props: {
                    placeholder: 'Bulk add quotes: a "~" should separate a quote\'s text and source, ' +
                        'and quotes should be separated by newlines. Quotation marks are ' +
                        'unnecessary. For example:\n\n' +
                        'All that we are is the result of what we have thought. ~ Buddha\n' +
                        'One of the secrets to staying young is to always do things you don’t know how to do, to keep learning. ~ Ruth Reichl\n' +
                        'The most common way people give up their power is by thinking they don’t have any. ~ Alice Walker',
                    value: text,
                    autoFocus: true,
                },
                on: {
                    change: onChangeText,
                },
            }),
        ]);
        const sourceEditor = h_2('p.nfe-quote-source', [
            h_2('span', '~ '),
            h_2('input.nfe-editor-source', {
                props: {
                    type: 'text',
                    placeholder: 'Source',
                    value: source,
                },
                on: {
                    change: onChangeSource,
                },
            }),
        ]);
        const buttons = h_2('div', [
            h_2('button.nfe-button', { on: { click: onCancel } }, 'Cancel'),
            h_2('button.nfe-button.nfe-button-primary', { on: { click: onSave } }, 'Save'),
            h_2('label.nfe-label.nfe-label-add-bulk', [
                h_2('input.nfe-checkbox', {
                    props: {
                        type: 'checkbox',
                        checked: isEditingBulk,
                    },
                    on: {
                        change: onCheckboxToggle,
                    },
                }),
                'Bulk add',
            ]),
        ]);
        const error = h_2('div.nfe-error', errorMessage);
        if (isEditingBulk) {
            if (errorMessage) {
                return h_2('div', [quoteEditorBulk, buttons, error]);
            }
            return h_2('div', [quoteEditorBulk, buttons]);
        }
        return h_2('div', [quoteEditor, sourceEditor, buttons]);
    };

    const MenuItem = (store, action, children) => {
        const onClick = e => {
            e.preventDefault();
            store.dispatch(menuHide());
            store.dispatch(action);
        };
        return h_2('li', [
            h_2('a.nfe-quote-action-menu-item', { props: { href: '#' }, on: { click: onClick } }, children),
        ]);
    };
    const QuoteMenu = (store) => {
        return h_2('div.nfe-quote-action-menu-content', [
            h_2('ul', [
                MenuItem(store, removeCurrentQuote(), 'Remove this quote'),
                MenuItem(store, selectNewQuote(), 'See another quote'),
                MenuItem(store, startEditing(), 'Enter custom quote...'),
            ]),
        ]);
    };
    const QuoteDisplay = (store) => {
        const state = store.getState();
        const quote = currentQuote(state);
        if (quote == null)
            return null;
        if (state.isEditingQuote) {
            return h_2('div.nfe-quote', [QuoteEditor(store)]);
        }
        const toggleMenu = () => store.dispatch(menuToggle());
        return h_2('div.nfe-quote', [
            h_2('nfe-quote-action-menu', [
                h_2('a.nfe-quote-action-menu-button', { props: { href: '#' }, on: { click: toggleMenu } }, '▾'),
                state.isQuoteMenuVisible ? QuoteMenu(store) : null,
            ]),
            h_2('div', [
                h_2('p.nfe-quote-text', [
                    h_2('span', '“'),
                    h_2('span', quote.text),
                    h_2('span', '”'),
                ]),
                h_2('p.nfe-quote-source', [h_2('span', '~ '), h_2('span', quote.source)]),
            ]),
        ]);
    };

    const CheckboxField = (store, checked, text, toggleAction, disabled = false) => {
        return h_2('label', [
            h_2('input', {
                props: {
                    type: 'checkbox',
                    checked,
                    disabled,
                },
                on: {
                    change: () => store.dispatch(toggleAction),
                },
            }),
            h_2('span', text),
        ]);
    };
    const Settings = (store) => {
        let state = store.getState();
        const fieldShowQuotes = CheckboxField(store, state.showQuotes, 'Show Quotes', toggleShowQuotes());
        const fieldShowBuiltin = CheckboxField(store, state.builtinQuotesEnabled, 'Enable Built-in Quotes', toggleBuiltinQuotes(), !state.showQuotes);
        const hiddenQuoteCount = state.hiddenBuiltinQuotes.length;
        const hiddenQuoteReset = e => {
            e.preventDefault();
            store.dispatch(resetHiddenQuotes());
        };
        const hiddenQuotes = h_2('span.nfe-settings-hidden-quote-count', [
            h_2('span', ' ' + hiddenQuoteCount + ' hidden - '),
            h_2('a', { props: { href: '#' }, on: { click: hiddenQuoteReset } }, 'Reset'),
        ]);
        const customQuotes = () => {
            if (state.customQuotes.length > 0) {
                return h_2('label', state.customQuotes.length + ' custom quotes');
            }
            return h_2('label', 'You can now add your own custom quotes! ' +
                'Just click the arrow menu beside the quote text.');
        };
        return h_2('form.nfe-settings', [
            h_2('fieldset', [
                h_2('legend', [fieldShowQuotes]),
                fieldShowBuiltin,
                hiddenQuoteCount > 0 ? hiddenQuotes : null,
                h_2('p', [customQuotes()]),
            ]),
        ]);
    };

    const Heading = (store) => {
        const closeInfoPanel = () => {
            store.dispatch(hideInfoPanel());
        };
        return [
            h_2('h1', 'News Feed Eradicator'),
            h_2('a.nfe-close-button', {
                props: { title: 'Close information panel' },
                on: { click: closeInfoPanel },
            }, 'X'),
        ];
    };
    const Icon = (svgPath) => (color) => h_2('svg', {
        attrs: {
            x: '0px',
            y: '0px',
            width: '32px',
            height: '32px',
            viewBox: '0 0 32 32',
            'enable-background': 'new 0 0 32 32',
        },
    }, [h_2('path', { attrs: { fill: color, d: svgPath } })]);
    const FacebookIcon = Icon('M30.7,0H1.3C0.6,0,0,0.6,0,1.3v29.3C0,31.4,0.6,32,1.3,32H17V20h-4v-5h4v-4 c0-4.1,2.6-6.2,6.3-6.2C25.1,4.8,26.6,5,27,5v4.3l-2.6,0c-2,0-2.5,1-2.5,2.4V15h5l-1,5h-4l0.1,12h8.6c0.7,0,1.3-0.6,1.3-1.3V1.3 C32,0.6,31.4,0,30.7,0z');
    const TwitterIcon = Icon('M32,6.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6C25.7,3.8,24,3,22.2,3 c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5C10.3,10.8,5.5,8.2,2.2,4.2c-0.6,1-0.9,2.1-0.9,3.3c0,2.3,1.2,4.3,2.9,5.5 c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1C2.9,27.9,6.4,29,10.1,29c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C30,8.5,31.1,7.4,32,6.1z');
    const Share = () => {
        return [
            h_2('h2', 'Share'),
            h_2('div.nfe-social-media-icons', [
                h_2('a.nfe-social-media-icon', { props: { href: 'https://www.facebook.com/NewsFeedEradicator/' } }, [FacebookIcon('#4f92ff')]),
                h_2('a.nfe-social-media-icon', { props: { href: 'https://twitter.com/NewsFeedErad' } }, [TwitterIcon('#4f92ff')]),
            ]),
        ];
    };
    const Contribute = () => {
        return [
            h_2('h2', 'Contribute'),
            h_2('p', [
                h_2('span', 'News Feed Eradicator is open source. '),
                h_2('a', {
                    props: { href: 'https://github.com/jordwest/news-feed-eradicator/' },
                }, 'Fork on GitHub'),
            ]),
        ];
    };
    const Remove = () => {
        return [
            h_2('h2', 'Remove'),
            h_2('ul', [
                h_2('li', [
                    h_2('a', {
                        props: {
                            href: 'https://west.io/news-feed-eradicator/remove.html',
                        },
                    }, 'Removal Instructions'),
                ]),
            ]),
        ];
    };
    const InfoPanel = (store) => {
        return h_2('div.nfe-info-panel', [
            h_2('div.nfe-info-col', [].concat(Heading(store), h_2('hr'), h_2('h2', 'Settings'), Settings(store), h_2('hr'), Share(), h_2('hr'), Contribute(), h_2('hr'), Remove())),
        ]);
    };

    const NewsFeedEradicator = (store) => {
        const state = store.getState();
        // TODO: Add quotes component
        const quoteDisplay = state.showQuotes ? QuoteDisplay(store) : null;
        const newFeatureLabel = areNewFeaturesAvailable(state)
            ? h_2('span.nfe-label.nfe-new-features', 'New Features!')
            : null;
        const infoPanel = state.showInfoPanel ? InfoPanel(store) : null;
        const onShowInfoPanel = () => store.dispatch(showInfoPanel());
        const link = h_2('a.nfe-info-link', { on: { click: onShowInfoPanel } }, [
            h_2('span', 'News Feed Eradicator'),
            newFeatureLabel,
        ]);
        // Entire app component
        return h_2('div', [infoPanel, quoteDisplay, link]);
    };

    function vnode(sel, data, children, text, elm) {
        var key = data === undefined ? undefined : data.key;
        return { sel: sel, data: data, children: children,
            text: text, elm: elm, key: key };
    }

    var array = Array.isArray;
    function primitive(s) {
        return typeof s === 'string' || typeof s === 'number';
    }

    function createElement(tagName) {
        return document.createElement(tagName);
    }
    function createElementNS(namespaceURI, qualifiedName) {
        return document.createElementNS(namespaceURI, qualifiedName);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    var htmlDomApi = {
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        createComment: createComment,
        insertBefore: insertBefore,
        removeChild: removeChild,
        appendChild: appendChild,
        parentNode: parentNode,
        nextSibling: nextSibling,
        tagName: tagName,
        setTextContent: setTextContent,
        getTextContent: getTextContent,
        isElement: isElement,
        isText: isText,
        isComment: isComment,
    };

    function isUndef(s) { return s === undefined; }
    function isDef(s) { return s !== undefined; }
    var emptyNode = vnode('', {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
    }
    function isVnode(vnode) {
        return vnode.sel !== undefined;
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var i, map = {}, key, ch;
        for (i = beginIdx; i <= endIdx; ++i) {
            ch = children[i];
            if (ch != null) {
                key = ch.key;
                if (key !== undefined)
                    map[key] = i;
            }
        }
        return map;
    }
    var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
    function init(modules, domApi) {
        var i, j, cbs = {};
        var api = domApi !== undefined ? domApi : htmlDomApi;
        for (i = 0; i < hooks.length; ++i) {
            cbs[hooks[i]] = [];
            for (j = 0; j < modules.length; ++j) {
                var hook = modules[j][hooks[i]];
                if (hook !== undefined) {
                    cbs[hooks[i]].push(hook);
                }
            }
        }
        function emptyNodeAt(elm) {
            var id = elm.id ? '#' + elm.id : '';
            var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    var parent_1 = api.parentNode(childElm);
                    api.removeChild(parent_1, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var i, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.init)) {
                    i(vnode);
                    data = vnode.data;
                }
            }
            var children = vnode.children, sel = vnode.sel;
            if (sel === '!') {
                if (isUndef(vnode.text)) {
                    vnode.text = '';
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                var hashIdx = sel.indexOf('#');
                var dotIdx = sel.indexOf('.', hashIdx);
                var hash = hashIdx > 0 ? hashIdx : sel.length;
                var dot = dotIdx > 0 ? dotIdx : sel.length;
                var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
                var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                    : api.createElement(tag);
                if (hash < dot)
                    elm.setAttribute('id', sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        var ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                i = vnode.data.hook; // Reuse variable
                if (isDef(i)) {
                    if (i.create)
                        i.create(emptyNode, vnode);
                    if (i.insert)
                        insertedVnodeQueue.push(vnode);
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                var ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var i, j, data = vnode.data;
            if (data !== undefined) {
                if (isDef(i = data.hook) && isDef(i = i.destroy))
                    i(vnode);
                for (i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (j = 0; j < vnode.children.length; ++j) {
                        i = vnode.children[j];
                        if (i != null && typeof i !== "string") {
                            invokeDestroyHook(i);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            for (; startIdx <= endIdx; ++startIdx) {
                var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                            cbs.remove[i_1](ch, rm);
                        if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                            i_1(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            var oldStartIdx = 0, newStartIdx = 0;
            var oldEndIdx = oldCh.length - 1;
            var oldStartVnode = oldCh[0];
            var oldEndVnode = oldCh[oldEndIdx];
            var newEndIdx = newCh.length - 1;
            var newStartVnode = newCh[0];
            var newEndVnode = newCh[newEndIdx];
            var oldKeyToIdx;
            var idxInOld;
            var elmToMove;
            var before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        newStartVnode = newCh[++newStartIdx];
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                        newStartVnode = newCh[++newStartIdx];
                    }
                }
            }
            if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
                if (oldStartIdx > oldEndIdx) {
                    before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                }
                else {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var i, hook;
            if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
                i(oldVnode, vnode);
            }
            var elm = vnode.elm = oldVnode.elm;
            var oldCh = oldVnode.children;
            var ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                i = vnode.data.hook;
                if (isDef(i) && isDef(i = i.update))
                    i(oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, '');
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, '');
                }
            }
            else if (oldVnode.text !== vnode.text) {
                api.setTextContent(elm, vnode.text);
            }
            if (isDef(hook) && isDef(i = hook.postpatch)) {
                i(oldVnode, vnode);
            }
        }
        return function patch(oldVnode, vnode) {
            var i, elm, parent;
            var insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (!isVnode(oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    var props = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function updateProps(oldVnode, vnode) {
        var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
        if (!oldProps && !props)
            return;
        if (oldProps === props)
            return;
        oldProps = oldProps || {};
        props = props || {};
        for (key in oldProps) {
            if (!props[key]) {
                delete elm[key];
            }
        }
        for (key in props) {
            cur = props[key];
            old = oldProps[key];
            if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
                elm[key] = cur;
            }
        }
    }
    exports.propsModule = { create: updateProps, update: updateProps };
    exports.default = exports.propsModule;

    });

    var propsModule = unwrapExports(props);
    var props_1 = props.propsModule;

    var attributes = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var xlinkNS = 'http://www.w3.org/1999/xlink';
    var xmlNS = 'http://www.w3.org/XML/1998/namespace';
    var colonChar = 58;
    var xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            var cur = attrs[key];
            var old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    exports.attributesModule = { create: updateAttrs, update: updateAttrs };
    exports.default = exports.attributesModule;

    });

    var attrsModule = unwrapExports(attributes);
    var attributes_1 = attributes.attributesModule;

    var eventlisteners = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call handler with arguments
            if (typeof handler[0] === "function") {
                // special case for single argument for performance
                if (handler.length === 2) {
                    handler[0].call(vnode, handler[1], event, vnode);
                }
                else {
                    var args = handler.slice(1);
                    args.push(event);
                    args.push(vnode);
                    handler[0].apply(vnode, args);
                }
            }
            else {
                // call multiple handlers
                for (var i = 0; i < handler.length; i++) {
                    invokeHandler(handler[i]);
                }
            }
        }
    }
    function handleEvent(event, vnode) {
        var name = event.type, on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        var oldOn = oldVnode.data.on, oldListener = oldVnode.listener, oldElm = oldVnode.elm, on = vnode && vnode.data.on, elm = (vnode && vnode.elm), name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            var listener = vnode.listener = oldVnode.listener || createListener();
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    exports.eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners
    };
    exports.default = exports.eventListenersModule;

    });

    var eventsModule = unwrapExports(eventlisteners);
    var eventlisteners_1 = eventlisteners.eventListenersModule;

    var htmldomapi = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    function createElement(tagName) {
        return document.createElement(tagName);
    }
    function createElementNS(namespaceURI, qualifiedName) {
        return document.createElementNS(namespaceURI, qualifiedName);
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    exports.htmlDomApi = {
        createElement: createElement,
        createElementNS: createElementNS,
        createTextNode: createTextNode,
        createComment: createComment,
        insertBefore: insertBefore,
        removeChild: removeChild,
        appendChild: appendChild,
        parentNode: parentNode,
        nextSibling: nextSibling,
        tagName: tagName,
        setTextContent: setTextContent,
        getTextContent: getTextContent,
        isElement: isElement,
        isText: isText,
        isComment: isComment,
    };
    exports.default = exports.htmlDomApi;

    });

    unwrapExports(htmldomapi);
    var htmldomapi_1 = htmldomapi.htmlDomApi;

    var tovnode = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });


    function toVNode(node, domApi) {
        var api = domApi !== undefined ? domApi : htmldomapi.default;
        var text;
        if (api.isElement(node)) {
            var id = node.id ? '#' + node.id : '';
            var cn = node.getAttribute('class');
            var c = cn ? '.' + cn.split(' ').join('.') : '';
            var sel = api.tagName(node).toLowerCase() + id + c;
            var attrs = {};
            var children = [];
            var name_1;
            var i = void 0, n = void 0;
            var elmAttrs = node.attributes;
            var elmChildren = node.childNodes;
            for (i = 0, n = elmAttrs.length; i < n; i++) {
                name_1 = elmAttrs[i].nodeName;
                if (name_1 !== 'id' && name_1 !== 'class') {
                    attrs[name_1] = elmAttrs[i].nodeValue;
                }
            }
            for (i = 0, n = elmChildren.length; i < n; i++) {
                children.push(toVNode(elmChildren[i], domApi));
            }
            return vnode_1.default(sel, { attrs: attrs }, children, undefined, node);
        }
        else if (api.isText(node)) {
            text = api.getTextContent(node);
            return vnode_1.default(undefined, undefined, undefined, text, node);
        }
        else if (api.isComment(node)) {
            text = api.getTextContent(node);
            return vnode_1.default('!', {}, [], text, node);
        }
        else {
            return vnode_1.default('', {}, [], undefined, node);
        }
    }
    exports.toVNode = toVNode;
    exports.default = toVNode;

    });

    unwrapExports(tovnode);
    var tovnode_1 = tovnode.toVNode;

    const storePromise = createStore$1();
    function isAlreadyInjected() {
        return document.querySelector('#nfe-container') != null;
    }
    function injectUI(streamContainer) {
        var nfeContainer = document.createElement('div');
        nfeContainer.id = 'nfe-container';
        streamContainer.appendChild(nfeContainer);
        const patch = init([propsModule, attrsModule, eventsModule]);
        let vnode = tovnode_1(nfeContainer);
        storePromise
            .then(store => {
            const render = () => {
                const newVnode = h_2('div#nfe-container', [NewsFeedEradicator(store)]);
                patch(vnode, newVnode);
                vnode = newVnode;
            };
            render();
            store.subscribe(render);
        })
            .catch(handleError);
    }

    const paths = ['', '/'];
    function isEnabled() {
        return paths.indexOf(window.location.pathname) > -1;
    }

    // Elements here are removed from the DOM.
    // These selectors should also be added to `eradicate.css`
    // to ensure they're hidden before the script loads.
    const elementsToRemove = [
        '.ticker_stream',
        '.ego_column',
        '#pagelet_gaming_destination_rhc',
        '#stories_pagelet_rhc',
        '#fb_stories_card_root',
        '#stories_pagelet_below_composer',
        '#pagelet_trending_tags_and_topics',
        '#pagelet_canvas_nav_content',
    ];
    const elementsToEmpty = ['[id^=topnews_main_stream]'];
    function checkSite() {
        return !!document.querySelector('#stream_pagelet');
    }
    function eradicate() {
        function eradicateRetry() {
            if (!isEnabled()) {
                return;
            }
            // Don't do anything if the FB UI hasn't loaded yet
            var streamContainer = document.querySelector('#stream_pagelet');
            if (streamContainer == null) {
                return;
            }
            remove({ toRemove: elementsToRemove, toEmpty: elementsToEmpty });
            // Add News Feed Eradicator quote/info panel
            if (!isAlreadyInjected()) {
                injectUI(streamContainer);
            }
        }
        // This delay ensures that the elements have been created by Facebook's
        // scripts before we attempt to replace them
        setInterval(eradicateRetry, 1000);
    }

    //export function checkSite(): boolean {
    //	return !!document.querySelector('#stream_pagelet');
    //}
    function eradicate$1() {
        function eradicateRetry() {
            if (!isEnabled()) {
                return;
            }
            // Don't do anything if the FB UI hasn't loaded yet
            const feed = document.querySelector('[role=feed]');
            const stories = document.querySelector('[aria-label=Stories]');
            if (feed == null) {
                return;
            }
            const container = feed.parentNode;
            // For some reason, removing these nodes are causing CPU usage to
            // sit at 100% while the page is open. Same thing if they're set to
            // display: none in CSS. I suspect it's to do with infinite scroll
            // again, so I'm going to leave the nodes in the tree for now, CSS
            // takes care of hiding them. It just means there's a scrollbar that
            // scrolls into emptiness, but it's better than constantly chewing CPU
            // for now.
            //
            //removeNode(feed);
            //removeNode(stories);
            // Add News Feed Eradicator quote/info panel
            if (!isAlreadyInjected()) {
                injectUI(container);
            }
        }
        // This delay ensures that the elements have been created by Facebook's
        // scripts before we attempt to replace them
        setInterval(eradicateRetry, 1000);
    }

    // Include the stylesheets
    // Determine which variant we're working with
    if (checkSite()) {
        eradicate();
    }
    else {
        eradicate$1();
    }

}());
