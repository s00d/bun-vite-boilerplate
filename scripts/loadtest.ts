// scripts/loadtest.ts
import "dotenv/config";
import autocannon from "autocannon";

const baseUrl = `http://${process.env.HOST}:${process.env.PORT}`;

async function getCsrfHeaders(): Promise<{ cookie: string; token: string }> {
  const res = await fetch(`${baseUrl}/`, {
    method: "GET",
    headers: {
      Accept: "text/html",
    },
  });

  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/csrf=([^;]+)/);
  const token = match?.[1] ?? "";

  return {
    cookie: setCookie,
    token,
  };
}


(async () => {
  const { cookie, token } = await getCsrfHeaders();

  const instance = autocannon(
    {
      url: `${baseUrl}/api/guest/login`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        Cookie: cookie,
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "secret",
      }),
      connections: 50,
      duration: 10,
    },
    console.error,
  );

  autocannon.track(instance, { renderProgressBar: true });
})();
