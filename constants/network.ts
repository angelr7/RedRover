const PORT = 8080;
const BASE_SERVER_URL = `http://192.168.1.37:${PORT}`;

// expand this if necessary
type RequestMethod = "GET" | "POST";
interface RequestBody {
  [key: string]: any;
}

const fetchHelper = async (
  endpoint: string,
  method: RequestMethod,
  body: RequestBody
) => {
  let result: any;
  try {
    result = await fetch(`${BASE_SERVER_URL}${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    result = error;
  }
  return result;
};

export { PORT, BASE_SERVER_URL, fetchHelper };
