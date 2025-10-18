import { Hono } from 'hono';
import { Render } from './render';
import { LoadBalancer } from './handler';
import { getAuthKey } from './auth';
import { getCookie, setCookie } from 'hono/cookie';

const app = new Hono<{ Bindings: Env }>();

// 管理页面访问，校验 HOME_ACCESS_KEY
app.get('/', (c) => {
	const sessionKey = getCookie(c, 'auth-key');
	const authKey = getAuthKey(c.req.raw, sessionKey);
	if (authKey !== c.env.HOME_ACCESS_KEY) {
		return c.html(Render({ isAuthenticated: false, showWarning: false }));
	}
	const showWarning =
		c.env.HOME_ACCESS_KEY === '7b18e536c27ab304266db3220b8e000db8fbbe35d6e1fde729a1a1d47303858d' || c.env.AUTH_KEY === 'ajielu';
	return c.html(Render({ isAuthenticated: true, showWarning }));
});

// 登录接口，校验 HOME_ACCESS_KEY，登录成功后写入 cookie
app.post('/', async (c) => {
	const { key } = await c.req.json();
	if (key === c.env.HOME_ACCESS_KEY) {
		setCookie(c, 'auth-key', key, { maxAge: 60 * 60 * 24 * 30, path: '/' });
		return c.json({ success: true });
	}
	return c.json({ success: false }, 401);
});

// 静态资源放行
app.get('/favicon.ico', async (c) => {
	return c.text('Not found', 404);
});

// 其它请求转发到 Durable Object
app.all('*', async (c) => {
	const id: DurableObjectId = c.env.LOAD_BALANCER.idFromName('loadbalancer');
	const stub = c.env.LOAD_BALANCER.get(id, { locationHint: 'wnam' });
	const resp = await stub.fetch(c.req.raw);
	return new Response(resp.body, {
		status: resp.status,
		headers: resp.headers,
	});
});

type Env = {
	LOAD_BALANCER: DurableObjectNamespace<LoadBalancer>;
	AUTH_KEY: string;
	HOME_ACCESS_KEY: string;
	FORWARD_CLIENT_KEY_ENABLED: string;
};

export default {
	fetch: app.fetch,
};

export { LoadBalancer };
