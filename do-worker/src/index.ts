import { LoadBalancer } from '../../src/handler';

interface Env {
	LOAD_BALANCER: DurableObjectNamespace;
	AUTH_KEY: string;
	HOME_ACCESS_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const id: DurableObjectId = env.LOAD_BALANCER.idFromName('loadbalancer');
		const stub = env.LOAD_BALANCER.get(id);
		return await stub.fetch(request);
	},
};

export { LoadBalancer };