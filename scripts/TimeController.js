export function TimeController(){

    this.last_time = 0;
    this.last_step = 0;
    this.current_time = 0;
    this.current_step = 0;

    this.update = function(sample_rate, paused, velocity ){
        if (this.last_time === 0){this.last_time = new Date().getTime()}
        this.current_time = new Date().getTime();

        let time_increment
        if (!paused) { time_increment = ( this.current_time - this.last_time ) / 1000 }
        else { time_increment = 0 }

        this.current_step = time_increment * sample_rate * velocity + this.last_step;
        this.last_time = this.current_time;
        this.last_step = this.current_step;
    }
}