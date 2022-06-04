# Live Limit

Need to limit the number of concurrent requests to a server? Or make sure only one function call is running at a time?
Live Limit to the rescue!

## Example

```ts
// Setup
const LIMITER = new LiveLimit({ maxLive: 3 });
async function myFunc(n: number) {
    // ... use n here ...
}

// Usage
const param = 1;
LIMITER.limit(async () => {
    await myFunc(param);
});
// Usage when you have many calls to make at once
const params = [1, 2, 3, 4, 5, 6];
params.forEach((param) => {
    LIMITER.limit(async () => {
        myFunc(param);
    });
});
```

### Example with Axios, React, and Redux

```ts
const LIMITER = new LiveLimit({ maxLive: 3 });

function SendButton() {
  const dataToSend: any[] = selector((state) => state.data.to.send);
  const [state, setState] = useState<"done" | "loading" | undefined>();

  return (<Button
    // Disable button while loading or done
    disabled={state !== undefined}
    // When clicked, make all the requests
    onClick={() => {
      // Disable the button
      setState("loading");
      // Wait until it's done to mark as done
      Promise.all(
        dataToSend.map(
          // Creating a promise for each request we need to do
          async (data) => {
            // Every request goes through the limiter
            await LIMITER.limit(async () => {
              await axios.post("/url/to/send/to", data);
            });
          }
        )
      ).then(() => {
        setState("done");
      });
    }}
  >
    Send all the data
  </Button>);
}
```
