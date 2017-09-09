import { observable } from 'mobx';
import { Observer } from './observer';

export class ObserverStore<T> {
  @observable version = 0;
  activeQueries: Array<Observer<T>> = [];

  createObservable() {
    const obs = new Observer<T>();
    this.activeQueries.push(obs);
    this.version++;
    return obs;
  }

  removeObservable(obs: Observer<T>) {
    obs.cleanup();
    this.activeQueries.splice(this.activeQueries.indexOf(obs), 1);
    this.version++;
  }
}
