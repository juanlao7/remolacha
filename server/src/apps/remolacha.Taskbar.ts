import { App } from '../App';
import { Connection } from '../Connection';

const TIME_UPDATE_INTERVAL = 1000;
const TIME_ERROR_MARGIN = 5000;

const app : App = {
    getCurrentTime: async (params : any, connection : Connection) => {
        let lastData : any = {timestamp: 0};
        let closed = false;

        connection.events.once('close', () => closed = true);

        while (!closed) {
            const data : any = {
                timestamp: Date.now(),
                utcOffset: -(new Date()).getTimezoneOffset() * 60 * 1000,
                zone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            const expectedTimestamp = lastData.timestamp + TIME_UPDATE_INTERVAL;

            if (Math.abs(expectedTimestamp - data.timestamp) > TIME_ERROR_MARGIN || lastData.utcOffset != data.utcOffset || lastData.zone != data.zone) {
                connection.send(data);
            }

            lastData = data;
            await new Promise(resolve => setTimeout(resolve, TIME_UPDATE_INTERVAL));
        }
    }
};

export default app;
