/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import Observer from "./observer.js";

class Context {

  constructor() {
    this.state = {};

    /** @type {Object.<string, Observer[]>} */
    this.observers = {};
  }

  init(state) {
    this.state = state;
  }

  register(component, componentInstance) {
    if (component.propsFromContext) {
      Object.entries(component.propsFromContext).forEach( ([propName, aliasName]) => {
        if (!(propName in this.observers)) {
          this.observers[propName] = [];
        }

        this.observers[propName].push(new Observer(aliasName, componentInstance));

        if (propName in this.state) {
          componentInstance[aliasName] = this.state[propName];
        }
      });
    } else {
      Object.entries(component.properties)
      .filter(([, value]) => value.fromContext)
      .forEach( ([propName]) => {
        if (!(propName in this.observers)) {
          this.observers[propName] = [];
        }

        this.observers[propName].push(new Observer(propName, componentInstance));
        if (propName in this.state) {
          componentInstance[propName] = this.state[propName];
        }
      });
    }
  }

  /**
   *
   * @param {string} propName
   * @param {any} value
   */
  setProp(propName, value) {
    this.state[propName] = value;

    if (propName in this.observers) {
      this.observers[propName].forEach(
        observer => {
          observer.component[observer.aliasName] = value;
        }
      );
    }
  }

  /**
   *
   * @param {Object<string, any>} props
   */
  setProps(props) {
    Object.entries(props).forEach(([propName, value]) => {
      this.setProp(propName, value);
    });
  }

  /**
   *
   * @param {(state: Object, ...params: any[]) => void} callback
   * @returns {(...params: any[]) => void}
   */
  action(callback) {
    return (...params) => {
      const nextState = callback(this.state, ...params);
      this.setProps(nextState);
    }
  }

  /**
   *
   * @param {(state: Object, ...params: any[]) => Promise<void>} callback
   * @returns { (...params: any[]) => Promise<void> }
   */
  asyncAction(callback) {
    return async (...params) => {
      const nextState = await callback(this.state, ...params);
      this.setProps(nextState);
    }
  }

  connect( component ) {
    const context = this;

    return class extends component {

      constructor(...args) {
        super(...args);

        context.register(component, this);
      }

      /**
       *
       * @param {string} propName
       * @param {any} value
       */
      setProp(propName, value) {
        context.setProp(propName, value);
      }

      /**
       * Accepts key-value pairs
       *
       * @param { Object<string, any>} props
       */
      setProps(props) {
        context.setProps(props);
      }
    }
  }
}

export default new Context();
