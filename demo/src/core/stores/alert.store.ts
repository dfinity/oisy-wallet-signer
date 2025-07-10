import { writable, type Readable } from 'svelte/store';

export interface Alert {
	message: string;
	type: 'error' | 'success';
	duration?: number;
}

export type AlertData = Alert | undefined | null;

export interface AlertStore extends Readable<AlertData> {
	set: (alert: Alert) => void;
	reset: () => void;
}

const initAlertStore = (): AlertStore => {
	const { subscribe, set } = writable<AlertData>(undefined);

	return {
		set: (alert) => set(alert),
		reset: () => set(null),
		subscribe
	};
};

export const alertStore = initAlertStore();
