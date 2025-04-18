export class TimeController {
    constructor() {

        this.last_time = 0;
        this.last_step = 0;
        this.current_time = 0;
        this.current_step = 0;
    }

    update = function (sample_rate, paused, velocity) {
        if (this.last_time === 0) { this.last_time = performance.now(); } // new Date().getTime()
        this.current_time = performance.now();

        let time_increment = 0;
        // console.log(this.current_time, this.last_time, velocity);
        if (!paused) { time_increment = (this.current_time - this.last_time) / 1000 * velocity; }

        this.current_step = time_increment * sample_rate + this.last_step;
        // console.log(paused, time_increment, sample_rate, this.last_step);
        this.last_time = this.current_time;
        this.last_step = this.current_step;
    };
}