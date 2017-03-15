import {observable, action} from 'mobx'
import {save} from '../'


class Storage {
  db = {};

  constructor(state) {
    this.db = Object.assign(this.db, state);
  }

  async getItem(key) {
    return this.db[key];
  }
  async setItem(key, value) {
    this.db[key] = value;
  }
}


describe('@save', () => {
  it('should load value from storage', done => {
    const storage = new Storage({
      'user:loginCount': JSON.stringify(999),
    });

    class User {
      storeName = 'user';

      @save({
        storage,
        onLoaded: (store, property, value) => {
          value.should.be.equal(999);
          store.loginCount.should.be.equal(999);
          done();
        }
      })
      @observable
      loginCount = 0;
    }

    const user = new User();
    user.loginCount.should.be.equal(0);
  });


  it('should save value to storage', done => {
    const storage = new Storage();

    class User {
      storeName = 'user';

      @save({
        storage,
        onInitialized: store => {
          store.login();
          store.loginCount.should.be.equal(1);
        },
        onSaved: async (store, property, value) => {
          value.should.be.equal(1);
          store.loginCount.should.be.equal(1);
          const saved = await storage.getItem('user:loginCount');
          saved.should.be.equal(JSON.stringify(1));
          done();
        }
      })
      @observable
      loginCount = 0;

      @action login() {
        this.loginCount += 1;
      }
    }

    const user = new User();
    user.loginCount.should.be.equal(0);
  });


  it('should be possible to specify/override storeName by options', done => {
    const storage = new Storage({
      'myUser:loginCount': JSON.stringify(999),
    });

    class User {
      storeName = 'user';

      @save({
        storage,
        storeName: 'myUser',
        onLoaded: (store, property, value) => {
          value.should.be.equal(999);
          store.loginCount.should.be.equal(999);
          done();
        }
      })
      @observable
      loginCount = 0;
    }

    const user = new User();
    user.loginCount.should.be.equal(0);
  });


  it('should set user value while loading', done => {
    const storage = new Storage({
      'user:loginCount': JSON.stringify(999),
    });

    class User {
      storeName = 'user';

      @save({
        storage,
        onSaved: async (store, property, value) => {
          value.should.be.equal(1);
          store.loginCount.should.be.equal(1);

          const saved = await storage.getItem('user:loginCount');
          saved.should.be.equal(JSON.stringify(1));
          done();
        }
      })
      @observable
      loginCount = 0;

      @action login() {
        this.loginCount += 1;
      }
    }

    const user = new User();
    user.loginCount.should.be.equal(0);
    user.login();
    user.loginCount.should.be.equal(1);
  });


  it('should transform works', done => {
    const storage = new Storage({
      'user:lastLogin': JSON.stringify(new Date(2013, 6, 17)),
    });

    class User {
      storeName = 'user';

      @save({
        storage,
        transform: value => new Date(value),
        onLoaded: (store, property, value) => {
          value.should.be.Date();
          value.should.be.eql(new Date(2013, 6, 17));
          store.lastLogin.should.be.Date();
          store.lastLogin.should.be.eql(new Date(2013, 6, 17));
          done();
        }
      })
      @observable
      lastLogin = new Date(2017, 3, 15);
    }

    const user = new User();
    user.lastLogin.should.be.eql(new Date(2017, 3, 15));
  });


  it('should set user value if setter called before getter', done => {
    const storage = new Storage({
      'user:loginCount': JSON.stringify(999),
    });

    class User {
      storeName = 'user';

      @save({
        storage,
        onLoaded: () => done("onLoaded called"),
        onInitialized: () => done(),
      })
      @observable
      loginCount = 0;

      @action login() {
        this.loginCount = 1;
      }
    }

    const user = new User();
    user.login();
    user.loginCount.should.be.equal(1);
  });
});