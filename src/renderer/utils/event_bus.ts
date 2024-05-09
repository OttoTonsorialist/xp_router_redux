const events:Map<string, CallableFunction[]> = new Map();


export default {
    $on(event_name:string, fn:CallableFunction) {
        if (!events.has(event_name)) {
            events.set(event_name, []);
        }

        events.get(event_name)?.push(fn);
    },

    $emit(event_name:string, data:any){
        if (events.has(event_name)) {
            events.get(event_name)?.forEach(fn => fn(data));
        }
    }
}
