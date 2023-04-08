
export default {
	async fetch(request, env, ctx) {
		let body = await request.json()
		console.log(body)
		return new Response(JSON.stringify(body, null, 2), {
			headers: {
				"content-type": "application/json;charset=UTF-8",
			},
		});
	}
}
