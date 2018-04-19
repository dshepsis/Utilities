class Pauser {
  constructor(opts = {paused: true}) {
    this.callbacks = [];
    this.paused = opts.paused;
  }
  enqueue(...cbs) {
    if (this.paused) {
      this.callbacks.push(...cbs);
    } else {
      for (const cb of cbs) {
        cb();
      }
    }
    return this;
  }
  pause() {
    if (this.paused) return false;
    this.paused = true;
    return true;
  }
  unpause() {
    if (!this.paused) return false;
    this.paused = false;
    for (const cb of this.callbacks) {
      cb();
    }
    this.callbacks = [];
    return true;
  }
}

const p = new Pauser({paused: true});
p.enqueue(
  ()=>console.log("1"),
  ()=>console.log("2"),
  ()=>console.log("3")
);
setTimeout(()=>p.enqueue(()=>console.log("4")), 1000);
setTimeout(()=>p.unpause(), 2000);
//2 seconds later:
//> 1
//> 2
//> 3
//> 4
