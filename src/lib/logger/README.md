# el-logger
A structured context logger.

### API
Go read the code, at the time of writing the logger itself is 100 SLOC, and the transports are 36.
It's fairly well-commented.

### Basic Usage
```javascript
const { Logger, transports } = require('el-logger');
const logger = new Logger({ transports: [transports.stdout()] });
logger.log('hello');
// Prints:
// {
//   "ts": "2019-12-02T16:27:21.204Z",
//   "msg": "hello",
//   "ctx": {}
// }
const answerLogger = logger.push({ answer: 42 });
answerLogger.log('we\'ve got the answer, but what is the question?');
// Prints:
// {
//   "ts": "2019-12-02T16:28:56.316Z",
//   "msg": "but what is the question?",
//   "ctx": {
//     "answer": 42
//   }
// }
const questionLogger = answerLogger.push({ question: 'Life, the universe, and everything' });
questionLogger.log('oh, of course')
// Prints (note the context)
// {
//   "ts": "2019-12-02T16:36:09.125Z",
//   "msg": "oh, of course",
//   "ctx": {
//     "answer": 42,
//     "question": "Life, the universe, and everything"
//   }
// }
```

### Why?
Trying to figure out how your request is being handled, but struggling to correlate a number of
interleaved asynchronous events? Add a request id to the logger context as soon as you receive your
request, and watch it get attached to every log line. Now, use a structured log viewer and a filter
such as:
```
.request.id = '1911e087-66a7-4a7c-bce6-be2177ea4977'
```

### Usage tips
The `.log` method stringifies all arguments with `util.inspect`. This means that any objects passed
to `.log` will be printed as an escaped string in the log `.message`. Instead, pass objects to
`.push` and they'll be reproduced tidily in your log output.

### Example
We'll log a bit too much, for illustration sake.
```javascript
const uuidv4 = require('uuid/v4');
const { Logger, transports } = require('el-logger');

// Some application vars
const logger = new Logger({
    context: { application: 'el-logger-example-app' },
    transports: [transports.stdout()],
});
const app = new (require('koa'))();
app.context.logger = logger;

// Handlers
const handlers = {
    '/': async (ctx, next) => {
        // Prints:
        // {
        //   "ts": "2019-12-02T16:44:24.997Z",
        //   "msg": "Received request on root",
        //   "ctx": {
        //     "application": "el-logger-example-app",
        //     "request": {
        //       "id": "770eeea9-8262-4441-a6f8-531483a7fedf",
        //       "path": "/",
        //       "method": "GET"
        //     },
        //     "handler": "[Function: /]"
        //   }
        // }
        ctx.state.logger.log('Received request on root');
        ctx.response.status = 204;
    },
};

// Middleware
app.use(async (ctx, next) => {
    // Got a request, add some context to the logger
    // This creates a new logger with the supplied context
    ctx.state.logger = logger.push({
        request: {
            id: uuidv4(),
            path: ctx.path,
            method: ctx.method,
        }
    });
    // Prints:
    // {
    //   "ts": "2019-12-02T16:44:24.996Z",
    //   "msg": "Request received",
    //   "ctx": {
    //     "application": "el-logger-example-app",
    //     "request": {
    //       "id": "770eeea9-8262-4441-a6f8-531483a7fedf",
    //       "path": "/",
    //       "method": "GET"
    //     }
    //   }
    // }
    ctx.state.logger.log('Request received');
    await next();
});

// Routes
app.use(async (ctx, next) => {
    const handler = handlers[ctx.path];
    if (handler) {
        ctx.state.logger = ctx.state.logger.push({ handler });
        // Prints:
        // {
        //   "ts": "2019-12-02T16:44:24.997Z",
        //   "msg": "Got handler",
        //   "ctx": {
        //     "application": "el-logger-example-app",
        //     "request": {
        //       "id": "770eeea9-8262-4441-a6f8-531483a7fedf",
        //       "path": "/",
        //       "method": "GET"
        //     },
        //     "handler": "[Function: /]"
        //   }
        // }
        ctx.state.logger.log('Got handler');
        await handler(ctx, next);
    }
    else {
    ctx.state.logger.log()
        ctx.state.logger.log('No handler found');
        ctx.response.status = 404;
    }
    await next();
});

// Post-handlers
app.use(async (ctx, next) => {
    // Prints:
    // {
    //   "ts": "2019-12-02T16:44:24.999Z",
    //   "msg": "Sending response",
    //   "ctx": {
    //     "application": "el-logger-example-app",
    //     "request": {
    //       "id": "770eeea9-8262-4441-a6f8-531483a7fedf",
    //       "path": "/",
    //       "method": "GET"
    //     },
    //     "handler": "[Function: /]",
    //     "response": {
    //       "status": 204,
    //       "message": "No Content",
    //       "header": {}
    //     }
    //   }
    // }
    ctx.state.logger.push({ response: ctx.response }).log('Sending response');
    await next();
});

// Start the server
// Prints:
// {
//   "ts": "2019-12-02T16:44:24.086Z",
//   "msg": "Listening on port 3000",
//   "ctx": {
//     "application": "el-logger-example-app"
//   }
// }
app.listen(3000, logger.log('Listening on port 3000'));
```
