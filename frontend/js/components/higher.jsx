import { h, Component } from 'preact'; // eslint-disable-line no-unused-vars
import { Resource } from './elements';
import { API } from 'app/api';
import { Router } from './routing';

// Comp: a component whose props should be loaded asynchronously. 
// onMount: when the component is mounted, called with a single argument: setState (see below).
// onUnmount: see onMount, except it's called when the component is unmounted.
//
// Additional Props
// setState: set the state of the underlying class-Component. The value is assumed
//           to be an Object. Async.props and Async.state are combined and fed as
//           props to Comp.
//
// forceUpdate: forces the component to update.
export function asyncWithProps(Comp, onMount = null, onUnmount = null) {
  return class Async extends Component {
    constructor(props) {
      super(props);
      this.state = {};
      this.queueSetState = this.queueSetState.bind(this);
      this.queueForceUpdate = this.queueForceUpdate.bind(this);
      this.setState = this.setState.bind(this);
      this.forceUpdate = this.forceUpdate.bind(this);
      this.queue = [];
    }

    componentDidMount() {
      this.drainQueue();

      if (onMount) {
        onMount(this.setState);
      }
    }

    componentWillUnmount() {
      this.drainQueue();

      if (onUnmount) {
        onUnmount(this.setState);
      }
    }

    drainQueue() {
      this.queue.forEach(({ func, args }) => func.apply(args || []));
    }

    queueSetState(state, callback) {
      if (this.base) {
        this.setState(state, callback);
      } else {
        this.queue.unshift({func: this.setState, args: [state, callback]});
      }
    }

    queueForceUpdate() {
      if (this.base) {
        this.setState(state, callback);
      } else {
        this.queue.unshift({func: this.forceUpdate, args: []});
      }
    }

    render() {
      return <Comp
              setState={this.queueSetState}
              forceUpdate={this.queueForceUpdate}
              {...this.props}
              {...this.state}
             />;
    }
  };
}

export function asyncWithObject(Comp, onMount = null, onUnmount = null, showsLoading = true) {
  return asyncWithProps(withProps({showsLoading: showsLoading, component: Comp}, Resource), onMount, onUnmount);
}

export function withPromise(promise, Comp, showsLoading = true) {
  return asyncWithObject(
    Comp,
    setState => promise.catch(e => setState({error: e})).then(o => setState({object: o})),
    null,
    showsLoading
  );
}

export function withPromiseFactory(pfact, Comp, showsLoading = true) {
  return props => h(withPromise(pfact(props), withProps(props, Comp), showsLoading), {});
}

export function secure(comp) {
  return props => API.isAuthenticated ? h(comp, props) : Router.replace("/login");
}

// TODO: make this wrap a components.
// This function exists because JS's regex
// implementation doesn't support bidirectional lookaround.
export function replacePath(comp, gen, guard = () => true) {
  return secure(() => {
    if (guard()) {
      const v = gen();
      const url = Router.getPath()
                        .split("/")
                        .map(u => u === comp ? v : u)
                        .join("/");
      return Router.replace(url);
    }
    return Router.replace("/");
  });
}

export function withProps(addlProps, Component) {
  return mapProps(props => Object.assign({}, props, addlProps), Component);
}

export function withObject(obj, comp) {
  return withProps({object: obj}, comp);
}

export function mapProps(f, Component) {
  return props => h(Component, f(props));
}

export default {
  secure: secure,
  replacePath: replacePath,
  withProps: withProps,
  withObject: withObject,
  mapProps: mapProps,
  asyncWithProps: asyncWithProps,
  asyncWithObject: asyncWithObject,
  withPromise: withPromise,
  withPromiseFactory: withPromiseFactory
};
