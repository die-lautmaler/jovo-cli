import * as http from 'http';
import { merge } from 'lodash';
import { ParsedUrlQueryInput, stringify } from 'querystring';

/**
 * Options for post request
 *
 * @export
 * @interface PostOptions
 */
export interface PostOptions {
  hostname?: string;
  port?: string;
  timeout?: number;
}

/**
 * Send post requests to local webhook
 *
 * @export
 * @param {object} data The data to send
 * @param {object} headers The headers to send
 * @param {object} queryParams The query parameters to send
 * @param {(PostOptions | undefined)} options The options for request
 * @returns {Promise<object>}
 */
export function post(
  data: object,
  headers: object,
  queryParams: ParsedUrlQueryInput,
  options: PostOptions | undefined,
): Promise<object> {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'content-type': 'application/json',
    };

    options = options || {};
    const hostname: string = options.hostname || 'localhost';
    const port: string = options.port || '3000';
    const timeout: number = options.timeout || 5000;
    const webhook_path = (headers as any).webhook_path || '';

    headers = merge(defaultHeaders, headers);
    // @ts-ignore
    delete headers.host;
    // @ts-ignore
    delete headers['content-length'];
    const queryParamsString = stringify(queryParams);

    const opt = {
      hostname,
      port,
      path: `/webhook${webhook_path}?${queryParamsString}`,
      method: 'POST',
      headers,
    };

    const postData = JSON.stringify(data);

    const req = http
      // @ts-ignore
      .request(opt, (res: http.IncomingMessage) => {
        res.setEncoding('utf8');

        let rawData = '';
        res.on('data', (chunk: string) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            e.rawData = rawData;
            reject(e);
          }
        });
      })
      .on('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'ECONNRESET') {
          e.message = 'Timeout error: No response after ' + timeout + ' milliseconds';
        } else if (e.code === 'ECONNREFUSED') {
          e.message = 'There is no Jovo instance running on ' + opt.hostname;
        }
        reject(e);
      })
      // @ts-ignore
      .on('socket', (socket) => {
        socket.setTimeout(timeout);
        socket.on('timeout', () => {
          req.abort();
        });
      });

    req.write(postData);
    req.end();
  });
}
