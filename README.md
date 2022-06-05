# Live Limit

![npm](https://img.shields.io/npm/v/live-limit) ![coverage badge](https://img.shields.io/codecov/c/github/SeriousBug/live-limit) ![tests badge](https://img.shields.io/github/workflow/status/SeriousBug/live-limit/test?label=tests) ![0 dependencies](https://img.shields.io/badge/dependencies-0-success)

Need to limit the number of concurrent requests to a server? Or make sure only one function call is running at a time?
Live Limit to the rescue!

## Docs

See the [Live Limit Docs](https://seriousbug.github.io/live-limit/) for details.

## Install

```sh
# with npm
npm install --save live-limit
# with yarn
yarn add live-limit
```

#### Requirements

Live Limit requires [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#browser_compatibility) and [`Map.values`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values#browser_compatibility). This is available on everything newer than node.js 12 and any non-IE browser.

If Internet Explorer support is required, consider polyfills.

## Example

```ts
import { LiveLimit } from "live-limit";

// Setup
// Only allows 3 function calls to be live at a time
const LIMITER = new LiveLimit({ maxLive: 3 });

// Making a single call:
const param = 1;
LIMITER.limit(async () => {
    // code here
});

// Making many calls:
//
// With these limiter settings, the first 3 calls will start immediately.
// The next 3 will pause until one of the earlier calls resolve or reject,
// at which point another call will start.
const params = [1, 2, 3, 4, 5, 6];
params.forEach((param) => {
    LIMITER.limit(async () => {
        myFunc(param);
    });
});
```

### Example with Axios, React, and Redux

```tsx
// ... other imports
import { LiveLimit } from "live-limit";

// 3 concurrent connections at max
const LIMITER = new LiveLimit({ maxLive: 3 });

function SendButton() {
    const dataToSend: any[] = selector((state) => state.data.to.send);
    const [state, setState] = useState<"done" | "loading" | undefined>();

    return (
        <Button
            // Disable button while loading or done
            disabled={state !== undefined}
            // When clicked, make all the requests
            onClick={() => {
                // Disable the button
                setState("loading");
                // Wait until it's done to mark as done
                Promise.all(
                    dataToSend.map(
                        // Creating a promise for each request
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
        </Button>
    );
}
```
