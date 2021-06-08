/* tslint:disable */
/* eslint-disable */
/**
 * MangaDex API
 * MangaDex is an ad-free manga reader offering high-quality images!  This document details our API as it is right now. It is in no way a promise to never change it, although we will endeavour to publicly notify any major change.  # Authentication  You can login with the `/auth/login` endpoint. On success, it will return a JWT that remains valid for 15 minutes along with a session token that allows refreshing without re-authenticating for 1 month.  # Rate limits  The API enforces rate-limits to protect our servers against malicious and/or mistaken use. The API keeps track of the requests on an IP-by-IP basis. Hence, if you\'re on a VPN, proxy or a shared network in general, the requests of other users on this network might affect you.  At first, a **global limit of 5 requests per second per IP address** is in effect.  > This limit is enforced across multiple load-balancers, and thus is not an exact value but rather a lower-bound that we guarantee. The exact value will be somewhere in the range `[5, 5*n]` (with `n` being the number of load-balancers currently active). The exact value within this range will depend on the current traffic patterns we are experiencing.  On top of this, **some endpoints are further restricted** as follows:  | Endpoint                           | Requests per time period    | Time period in minutes | |------------------------------------|--------------------------   |------------------------| | `POST   /account/create`           | 1                           | 60                     | | `GET    /account/activate/{code}`  | 30                          | 60                     | | `POST   /account/activate/resend`  | 5                           | 60                     | | `POST   /account/recover`          | 5                           | 60                     | | `POST   /account/recover/{code}`   | 5                           | 60                     | | `POST   /auth/login`               | 30                          | 60                     | | `POST   /auth/refresh`             | 30                          | 60                     | | `POST   /author`                   | 10                          | 60                     | | `PUT    /author`                   | 10                          | 1                      | | `DELETE /author/{id}`              | 10                          | 10                     | | `POST   /captcha/solve`            | 10                          | 10                     | | `POST   /chapter/{id}/read`        | 300                         | 10                     | | `PUT    /chapter/{id}`             | 10                          | 1                      | | `DELETE /chapter/{id}`             | 10                          | 1                      | | `POST   /manga`                    | 10                          | 60                     | | `PUT    /manga/{id}`               | 10                          | 60                     | | `DELETE /manga/{id}`               | 10                          | 10                     | | `POST   /cover`                    | 10                          | 1                      | | `PUT    /cover/{id}`               | 10                          | 1                      | | `DELETE /cover/{id}`               | 10                          | 10                     | | `POST   /group`                    | 10                          | 60                     | | `PUT    /group/{id}`               | 10                          | 1                      | | `DELETE /group/{id}`               | 10                          | 10                     | | `GET    /at-home/server/{id}`      | 60                          | 1                      |  Calling these endpoints will further provide details via the following headers about your remaining quotas:  | Header                    | Description                                                                 | |---------------------------|-----------------------------------------------------------------------------| | `X-RateLimit-Limit`       | Maximal number of requests this endpoint allows per its time period         | | `X-RateLimit-Remaining`   | Remaining number of requests within your quota for the current time period  | | `X-RateLimit-Retry-After` | Timestamp of the end of the current time period, as UNIX timestamp          |  # Result Limit  Most of our listing endpoints will return a maximum number of total results that is currently capped at 10.000 items. Beyond that you will not receive any more items no matter how far you paginate and the results will become empty instead. This is for performance reasons and a limitation we will not lift.  Note that the limit is applied to a search query and list endpoints with or without any filters are search queries. If you need to retrieve more items, use filters to narrow down your search.  # Captchas  Some endpoints may require captchas to proceed, in order to slow down automated malicious traffic. Legitimate users might also be affected, based on the frequency of write requests or due certain endpoints being particularly sensitive to malicious use, such as user signup.  Once an endpoint decides that a captcha needs to be solved, a 403 Forbidden response will be returned, with the error code `captcha_required_exception`. The sitekey needed for recaptcha to function is provided in both the `X-Captcha-Sitekey` header field, as well as in the error context, specified as `siteKey` parameter.  The captcha result of the client can either be passed into the repeated original request with the `X-Captcha-Result` header or alternatively to the `POST /captcha/solve` endpoint. The time a solved captcha is remembered varies across different endpoints and can also be influenced by individual client behavior.  Authentication is not required for the `POST /captcha/solve` endpoint, captchas are tracked both by client ip and logged in user id. If you are logged in, you want to send the session token along, so you validate the captcha for your client ip and user id at the same time, but it is not required.  # Reading a chapter using the API  ## Retrieving pages from the MangaDex@Home network  A valid [MangaDex@Home network](https://mangadex.network) page URL is in the following format: `{server-specific base url}/{temporary access token}/{quality mode}/{chapter hash}/{filename}`  There are currently 2 quality modes: - `data`: Original upload quality - `data-saver`: Compressed quality  Upon fetching a chapter from the API, you will find 4 fields necessary to compute MangaDex@Home page URLs:  | Field                        | Type     | Description                       | |------------------------------|----------|-----------------------------------| | `.data.id`                   | `string` | API Chapter ID                    | | `.data.attributes.hash`      | `string` | MangaDex@Home Chapter Hash        | | `.data.attributes.data`      | `array`  | data quality mode filenames       | | `.data.attributes.dataSaver` | `array`  | data-saver quality mode filenames |  Example ```json GET /chapter/{id}  {   ...,   \"data\": {     \"id\": \"e46e5118-80ce-4382-a506-f61a24865166\",     ...,     \"attributes\": {       ...,       \"hash\": \"e199c7d73af7a58e8a4d0263f03db660\",       \"data\": [         \"x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png\",         ...       ],       \"dataSaver\": [         \"x1-ab2b7c8f30c843aa3a53c29bc8c0e204fba4ab3e75985d761921eb6a52ff6159.jpg\",         ...       ]     }   } } ```  From this point you miss only the base URL to an assigned MangaDex@Home server for your client and chapter. This is retrieved via a `GET` request to `/at-home/server/{ chapter .data.id }`.  Example: ```json GET /at-home/server/e46e5118-80ce-4382-a506-f61a24865166  {   \"baseUrl\": \"https://abcdefg.hijklmn.mangadex.network:12345/some-token\" } ```  The full URL is the constructed as follows ``` { server .baseUrl }/{ quality mode }/{ chapter .data.attributes.hash }/{ chapter .data.attributes.{ quality mode }.[*] }  Examples  data quality: https://abcdefg.hijklmn.mangadex.network:12345/some-token/data/e199c7d73af7a58e8a4d0263f03db660/x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png        base url: https://abcdefg.hijklmn.mangadex.network:12345/some-token   quality mode: data   chapter hash: e199c7d73af7a58e8a4d0263f03db660       filename: x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png   data-saver quality: https://abcdefg.hijklmn.mangadex.network:12345/some-token/data-saver/e199c7d73af7a58e8a4d0263f03db660/x1-ab2b7c8f30c843aa3a53c29bc8c0e204fba4ab3e75985d761921eb6a52ff6159.jpg        base url: https://abcdefg.hijklmn.mangadex.network:12345/some-token   quality mode: data-saver   chapter hash: e199c7d73af7a58e8a4d0263f03db660       filename: x1-ab2b7c8f30c843aa3a53c29bc8c0e204fba4ab3e75985d761921eb6a52ff6159.jpg ```  If the server you have been assigned fails to serve images, you are allowed to call the `/at-home/server/{ chapter id }` endpoint again to get another server.  Whether successful or not, **please do report the result you encountered as detailed below**. This is so we can pull the faulty server out of the network.  ## Report  In order to keep track of the health of the servers in the network and to improve the quality of service and reliability, we ask that you call the MangaDex@Home report endpoint after each image you retrieve, whether successfully or not.  It is a `POST` request against `https://api.mangadex.network/report` and expects the following payload with our example above:  | Field                       | Type       | Description                                                                         | |-----------------------------|------------|-------------------------------------------------------------------------------------| | `url`                       | `string`   | The full URL of the image                                                           | | `success`                   | `boolean`  | Whether the image was successfully retrieved                                        | | `cached `                   | `boolean`  | `true` iff the server returned an `X-Cache` header with a value starting with `HIT` | | `bytes`                     | `number`   | The size in bytes of the retrieved image                                            | | `duration`                  | `number`   | The time in miliseconds that the complete retrieval (not TTFB) of this image took   |  Examples herafter.  **Success:** ```json POST https://api.mangadex.network/report Content-Type: application/json  {   \"url\": \"https://abcdefg.hijklmn.mangadex.network:12345/some-token/data/e199c7d73af7a58e8a4d0263f03db660/x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png\",   \"success\": true,   \"bytes\": 727040,   \"duration\": 235,   \"cached\": true } ```  **Failure:** ```json POST https://api.mangadex.network/report Content-Type: application/json  {  \"url\": \"https://abcdefg.hijklmn.mangadex.network:12345/some-token/data/e199c7d73af7a58e8a4d0263f03db660/x1-b765e86d5ecbc932cf3f517a8604f6ac6d8a7f379b0277a117dc7c09c53d041e.png\",  \"success\": false,  \"bytes\": 25,  \"duration\": 235,  \"cached\": false } ```  While not strictly necessary, this helps us monitor the network\'s healthiness, and we appreciate your cooperation towards this goal. If no one reports successes and failures, we have no way to know that a given server is slow/broken, which eventually results in broken image retrieval for everyone.  # Retrieving Covers from the API  ## Construct Cover URLs  ### Source (original/best quality)  `https://uploads.mangadex.org/covers/{ manga.id }/{ cover.filename }`<br/> The extension can be png, jpeg or gif.  Example: `https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/4113e972-d228-4172-a885-cb30baffff97.jpg`  ### <=512px wide thumbnail  `https://uploads.mangadex.org/covers/{ manga.id }/{ cover.filename }.512.jpg`<br/> The extension is always jpg.  Example: `https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/4113e972-d228-4172-a885-cb30baffff97.jpg.512.jpg`  ### <=256px wide thumbnail  `https://uploads.mangadex.org/covers/{ manga.id }/{ cover.filename }.256.jpg`<br/> The extension is always jpg.  Example: `https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/4113e972-d228-4172-a885-cb30baffff97.jpg.256.jpg`  ## ℹ️ Where to find Cover filename ?  Look at the [Get cover operation](#operation/get-cover) endpoint to get Cover information. Also, if you get a Manga resource, you\'ll have, if available a `covert_art` relationship which is the main cover id.  # Static data  ## Manga publication demographic  | Value            | Description               | |------------------|---------------------------| | shounen          | Manga is a Shounen        | | shoujo           | Manga is a Shoujo         | | josei            | Manga is a Josei          | | seinen           | Manga is a Seinen         |  ## Manga status  | Value            | Description               | |------------------|---------------------------| | ongoing          | Manga is still going on   | | completed        | Manga is completed        | | hiatus           | Manga is paused           | | cancelled        | Manga has been cancelled  |  ## Manga reading status  | Value            | |------------------| | reading          | | on_hold          | | plan\\_to\\_read   | | dropped          | | re\\_reading      | | completed        |  ## Manga content rating  | Value            | Description               | |------------------|---------------------------| | safe             | Safe content              | | suggestive       | Suggestive content        | | erotica          | Erotica content           | | pornographic     | Pornographic content      |  ## CustomList visibility  | Value            | Description               | |------------------|---------------------------| | public           | CustomList is public      | | private          | CustomList is private     |  ## Relationship types  | Value            | Description                    | |------------------|--------------------------------| | manga            | Manga resource                 | | chapter          | Chapter resource               | | cover_art        | A Cover Art for a manga `*`    | | author           | Author resource                | | artist           | Author resource (drawers only) | | scanlation_group | ScanlationGroup resource       | | tag              | Tag resource                   | | user             | User resource                  | | custom_list      | CustomList resource            |  `*` Note, that on manga resources you get only one cover_art resource relation marking the primary cover if there are more than one. By default this will be the latest volume\'s cover art. If you like to see all the covers for a given manga, use the cover search endpoint for your mangaId and select the one you wish to display.  ## Manga links data  In Manga attributes you have the `links` field that is a JSON object with some strange keys, here is how to decode this object:  | Key   | Related site  | URL                                                                                           | URL details                                                    | |-------|---------------|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------| | al    | anilist       | https://anilist.co/manga/`{id}`                                                               | Stored as id                                                   | | ap    | animeplanet   | https://www.anime-planet.com/manga/`{slug}`                                                   | Stored as slug                                                 | | bw    | bookwalker.jp | https://bookwalker.jp/`{slug}`                                                                | Stored has \"series/{id}\"                                       | | mu    | mangaupdates  | https://www.mangaupdates.com/series.html?id=`{id}`                                            | Stored has id                                                  | | nu    | novelupdates  | https://www.novelupdates.com/series/`{slug}`                                                  | Stored has slug                                                | | kt    | kitsu.io      | https://kitsu.io/api/edge/manga/`{id}` or https://kitsu.io/api/edge/manga?filter[slug]={slug} | If integer, use id version of the URL, otherwise use slug one  | | amz   | amazon        | N/A                                                                                           | Stored as full URL                                             | | ebj   | ebookjapan    | N/A                                                                                           | Stored as full URL                                             | | mal   | myanimelist   | https://myanimelist.net/manga/{id}                                                            | Store as id                                                    | | raw   | N/A           | N/A                                                                                           | Stored as full URL, untranslated stuff URL (original language) | | engtl | N/A           | N/A                                                                                           | Stored as full URL, official english licenced URL              |
 *
 * The version of the OpenAPI document: 5.0.26
 * Contact: mangadexstaff@gmail.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { Configuration } from './configuration';
import globalAxios, { AxiosPromise, AxiosInstance } from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, RequestArgs, BaseAPI, RequiredError } from './base';

/**
 * 
 * @export
 * @interface AccountActivateResponse
 */
export interface AccountActivateResponse {
    /**
     * 
     * @type {string}
     * @memberof AccountActivateResponse
     */
    result?: AccountActivateResponseResultEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum AccountActivateResponseResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface Author
 */
export interface Author {
    /**
     * 
     * @type {string}
     * @memberof Author
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Author
     */
    type?: AuthorTypeEnum;
    /**
     * 
     * @type {AuthorAttributes}
     * @memberof Author
     */
    attributes?: AuthorAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum AuthorTypeEnum {
    Author = 'author'
}

/**
 * 
 * @export
 * @interface AuthorAttributes
 */
export interface AuthorAttributes {
    /**
     * 
     * @type {string}
     * @memberof AuthorAttributes
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof AuthorAttributes
     */
    imageUrl?: string;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof AuthorAttributes
     */
    biography?: { [key: string]: string; };
    /**
     * 
     * @type {number}
     * @memberof AuthorAttributes
     */
    version?: number;
    /**
     * 
     * @type {string}
     * @memberof AuthorAttributes
     */
    createdAt?: string;
    /**
     * 
     * @type {string}
     * @memberof AuthorAttributes
     */
    updatedAt?: string;
}
/**
 * 
 * @export
 * @interface AuthorCreate
 */
export interface AuthorCreate {
    /**
     * 
     * @type {string}
     * @memberof AuthorCreate
     */
    name: string;
    /**
     * 
     * @type {number}
     * @memberof AuthorCreate
     */
    version?: number;
}
/**
 * 
 * @export
 * @interface AuthorEdit
 */
export interface AuthorEdit {
    /**
     * 
     * @type {string}
     * @memberof AuthorEdit
     */
    name?: string;
    /**
     * 
     * @type {number}
     * @memberof AuthorEdit
     */
    version: number;
}
/**
 * 
 * @export
 * @interface AuthorList
 */
export interface AuthorList {
    /**
     * 
     * @type {Array<AuthorResponse>}
     * @memberof AuthorList
     */
    results?: Array<AuthorResponse>;
    /**
     * 
     * @type {number}
     * @memberof AuthorList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof AuthorList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof AuthorList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface AuthorResponse
 */
export interface AuthorResponse {
    /**
     * 
     * @type {string}
     * @memberof AuthorResponse
     */
    result?: string;
    /**
     * 
     * @type {Author}
     * @memberof AuthorResponse
     */
    data?: Author;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof AuthorResponse
     */
    relationships?: Array<Relationship>;
}
/**
 * 
 * @export
 * @interface Chapter
 */
export interface Chapter {
    /**
     * 
     * @type {string}
     * @memberof Chapter
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Chapter
     */
    type?: ChapterTypeEnum;
    /**
     * 
     * @type {ChapterAttributes}
     * @memberof Chapter
     */
    attributes?: ChapterAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum ChapterTypeEnum {
    Chapter = 'chapter'
}

/**
 * 
 * @export
 * @interface ChapterAttributes
 */
export interface ChapterAttributes {
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    title?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    volume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    chapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    translatedLanguage?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    hash?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterAttributes
     */
    data?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterAttributes
     */
    dataSaver?: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    uploader?: string;
    /**
     * 
     * @type {number}
     * @memberof ChapterAttributes
     */
    version?: number;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    createdAt?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    updatedAt?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterAttributes
     */
    publishAt?: string;
}
/**
 * 
 * @export
 * @interface ChapterEdit
 */
export interface ChapterEdit {
    /**
     * 
     * @type {string}
     * @memberof ChapterEdit
     */
    title?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterEdit
     */
    volume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterEdit
     */
    chapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterEdit
     */
    translatedLanguage?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterEdit
     */
    data?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterEdit
     */
    dataSaver?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof ChapterEdit
     */
    version: number;
}
/**
 * 
 * @export
 * @interface ChapterList
 */
export interface ChapterList {
    /**
     * 
     * @type {Array<ChapterResponse>}
     * @memberof ChapterList
     */
    results?: Array<ChapterResponse>;
    /**
     * 
     * @type {number}
     * @memberof ChapterList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof ChapterList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof ChapterList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface ChapterRequest
 */
export interface ChapterRequest {
    /**
     * 
     * @type {string}
     * @memberof ChapterRequest
     */
    title?: string;
    /**
     * 
     * @type {string}
     * @memberof ChapterRequest
     */
    volume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterRequest
     */
    chapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ChapterRequest
     */
    translatedLanguage?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterRequest
     */
    data?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterRequest
     */
    dataSaver?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof ChapterRequest
     */
    version?: number;
}
/**
 * 
 * @export
 * @interface ChapterResponse
 */
export interface ChapterResponse {
    /**
     * 
     * @type {string}
     * @memberof ChapterResponse
     */
    result?: ChapterResponseResultEnum;
    /**
     * 
     * @type {Chapter}
     * @memberof ChapterResponse
     */
    data?: Chapter;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof ChapterResponse
     */
    relationships?: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum ChapterResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface CheckResponse
 */
export interface CheckResponse {
    /**
     * 
     * @type {string}
     * @memberof CheckResponse
     */
    result?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CheckResponse
     */
    isAuthenticated?: boolean;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckResponse
     */
    roles?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckResponse
     */
    permissions?: Array<string>;
}
/**
 * 
 * @export
 * @interface Cover
 */
export interface Cover {
    /**
     * 
     * @type {string}
     * @memberof Cover
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Cover
     */
    type?: CoverTypeEnum;
    /**
     * 
     * @type {CoverAttributes}
     * @memberof Cover
     */
    attributes?: CoverAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum CoverTypeEnum {
    CoverArt = 'cover_art'
}

/**
 * 
 * @export
 * @interface CoverAttributes
 */
export interface CoverAttributes {
    /**
     * 
     * @type {string}
     * @memberof CoverAttributes
     */
    volume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof CoverAttributes
     */
    fileName?: string;
    /**
     * 
     * @type {string}
     * @memberof CoverAttributes
     */
    description?: string | null;
    /**
     * 
     * @type {number}
     * @memberof CoverAttributes
     */
    version?: number;
    /**
     * 
     * @type {string}
     * @memberof CoverAttributes
     */
    createdAt?: string;
    /**
     * 
     * @type {string}
     * @memberof CoverAttributes
     */
    updatedAt?: string;
}
/**
 * 
 * @export
 * @interface CoverEdit
 */
export interface CoverEdit {
    /**
     * 
     * @type {string}
     * @memberof CoverEdit
     */
    volume: string | null;
    /**
     * 
     * @type {string}
     * @memberof CoverEdit
     */
    description?: string | null;
    /**
     * 
     * @type {number}
     * @memberof CoverEdit
     */
    version: number;
}
/**
 * 
 * @export
 * @interface CoverList
 */
export interface CoverList {
    /**
     * 
     * @type {Array<CoverResponse>}
     * @memberof CoverList
     */
    results?: Array<CoverResponse>;
    /**
     * 
     * @type {number}
     * @memberof CoverList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof CoverList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof CoverList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface CoverResponse
 */
export interface CoverResponse {
    /**
     * 
     * @type {string}
     * @memberof CoverResponse
     */
    result?: string;
    /**
     * 
     * @type {Cover}
     * @memberof CoverResponse
     */
    data?: Cover;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof CoverResponse
     */
    relationships?: Array<Relationship>;
}
/**
 * 
 * @export
 * @interface CreateAccount
 */
export interface CreateAccount {
    /**
     * 
     * @type {string}
     * @memberof CreateAccount
     */
    username: string;
    /**
     * 
     * @type {string}
     * @memberof CreateAccount
     */
    password: string;
    /**
     * 
     * @type {string}
     * @memberof CreateAccount
     */
    email: string;
}
/**
 * 
 * @export
 * @interface CreateScanlationGroup
 */
export interface CreateScanlationGroup {
    /**
     * 
     * @type {string}
     * @memberof CreateScanlationGroup
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof CreateScanlationGroup
     */
    leader?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof CreateScanlationGroup
     */
    members?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof CreateScanlationGroup
     */
    version?: number;
}
/**
 * 
 * @export
 * @interface CustomList
 */
export interface CustomList {
    /**
     * 
     * @type {string}
     * @memberof CustomList
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof CustomList
     */
    type?: CustomListTypeEnum;
    /**
     * 
     * @type {CustomListAttributes}
     * @memberof CustomList
     */
    attributes?: CustomListAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum CustomListTypeEnum {
    CustomList = 'custom_list'
}

/**
 * 
 * @export
 * @interface CustomListAttributes
 */
export interface CustomListAttributes {
    /**
     * 
     * @type {string}
     * @memberof CustomListAttributes
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof CustomListAttributes
     */
    visibility?: CustomListAttributesVisibilityEnum;
    /**
     * 
     * @type {User}
     * @memberof CustomListAttributes
     */
    owner?: User;
    /**
     * 
     * @type {number}
     * @memberof CustomListAttributes
     */
    version?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum CustomListAttributesVisibilityEnum {
    Private = 'private',
    Public = 'public'
}

/**
 * 
 * @export
 * @interface CustomListCreate
 */
export interface CustomListCreate {
    /**
     * 
     * @type {string}
     * @memberof CustomListCreate
     */
    name: string;
    /**
     * 
     * @type {string}
     * @memberof CustomListCreate
     */
    visibility?: CustomListCreateVisibilityEnum;
    /**
     * 
     * @type {Array<string>}
     * @memberof CustomListCreate
     */
    manga?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof CustomListCreate
     */
    version?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum CustomListCreateVisibilityEnum {
    Public = 'public',
    Private = 'private'
}

/**
 * 
 * @export
 * @interface CustomListEdit
 */
export interface CustomListEdit {
    /**
     * 
     * @type {string}
     * @memberof CustomListEdit
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof CustomListEdit
     */
    visibility?: CustomListEditVisibilityEnum;
    /**
     * 
     * @type {Array<string>}
     * @memberof CustomListEdit
     */
    manga?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof CustomListEdit
     */
    version: number;
}

/**
    * @export
    * @enum {string}
    */
export enum CustomListEditVisibilityEnum {
    Public = 'public',
    Private = 'private'
}

/**
 * 
 * @export
 * @interface CustomListList
 */
export interface CustomListList {
    /**
     * 
     * @type {Array<CustomListResponse>}
     * @memberof CustomListList
     */
    results?: Array<CustomListResponse>;
    /**
     * 
     * @type {number}
     * @memberof CustomListList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof CustomListList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof CustomListList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface CustomListResponse
 */
export interface CustomListResponse {
    /**
     * 
     * @type {string}
     * @memberof CustomListResponse
     */
    result?: CustomListResponseResultEnum;
    /**
     * 
     * @type {CustomList}
     * @memberof CustomListResponse
     */
    data?: CustomList;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof CustomListResponse
     */
    relationships?: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum CustomListResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface ErrorResponse
 */
export interface ErrorResponse {
    /**
     * 
     * @type {string}
     * @memberof ErrorResponse
     */
    result?: string;
    /**
     * 
     * @type {Array<Error>}
     * @memberof ErrorResponse
     */
    errors?: Array<Error>;
}
/**
 * 
 * @export
 * @interface InlineObject1
 */
export interface InlineObject1 {
    /**
     * 
     * @type {string}
     * @memberof InlineObject1
     */
    captchaChallenge: string;
}
/**
 * 
 * @export
 * @interface InlineResponse200
 */
export interface InlineResponse200 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200
     */
    result?: string;
    /**
     * 
     * @type {{ [key: string]: InlineResponse200Volumes; }}
     * @memberof InlineResponse200
     */
    volumes?: { [key: string]: InlineResponse200Volumes; };
}
/**
 * 
 * @export
 * @interface InlineResponse2001
 */
export interface InlineResponse2001 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2001
     */
    result?: InlineResponse2001ResultEnum;
    /**
     * 
     * @type {Array<string>}
     * @memberof InlineResponse2001
     */
    data?: Array<string>;
}

/**
    * @export
    * @enum {string}
    */
export enum InlineResponse2001ResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface InlineResponse2002
 */
export interface InlineResponse2002 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2002
     */
    result?: InlineResponse2002ResultEnum;
    /**
     * 
     * @type {Array<string> | any}
     * @memberof InlineResponse2002
     */
    data?: Array<string> | any;
}

/**
    * @export
    * @enum {string}
    */
export enum InlineResponse2002ResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface InlineResponse2003
 */
export interface InlineResponse2003 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2003
     */
    result?: InlineResponse2003ResultEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum InlineResponse2003ResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface InlineResponse2004
 */
export interface InlineResponse2004 {
    /**
     * The base URL to construct final image URLs from. The URL returned is valid for the requested chapter only, and for a duration of 15 minutes from the time of the response.
     * @type {string}
     * @memberof InlineResponse2004
     */
    baseUrl?: string;
}
/**
 * 
 * @export
 * @interface InlineResponse2005
 */
export interface InlineResponse2005 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2005
     */
    result?: string;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof InlineResponse2005
     */
    statuses?: { [key: string]: string; };
}

/**
    * @export
    * @enum {string}
    */
export enum InlineResponse2005StatusesEnum {
    Reading = 'reading',
    OnHold = 'on_hold',
    PlanToRead = 'plan_to_read',
    Dropped = 'dropped',
    ReReading = 're_reading',
    Completed = 'completed'
}

/**
 * 
 * @export
 * @interface InlineResponse2006
 */
export interface InlineResponse2006 {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2006
     */
    result?: string;
    /**
     * 
     * @type {string}
     * @memberof InlineResponse2006
     */
    status?: InlineResponse2006StatusEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum InlineResponse2006StatusEnum {
    Reading = 'reading',
    OnHold = 'on_hold',
    PlanToRead = 'plan_to_read',
    Dropped = 'dropped',
    ReReading = 're_reading',
    Completed = 'completed'
}

/**
 * 
 * @export
 * @interface InlineResponse200Chapters
 */
export interface InlineResponse200Chapters {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200Chapters
     */
    chapter?: string;
    /**
     * 
     * @type {number}
     * @memberof InlineResponse200Chapters
     */
    count?: number;
}
/**
 * 
 * @export
 * @interface InlineResponse200Volumes
 */
export interface InlineResponse200Volumes {
    /**
     * 
     * @type {string}
     * @memberof InlineResponse200Volumes
     */
    volume?: string;
    /**
     * 
     * @type {number}
     * @memberof InlineResponse200Volumes
     */
    count?: number;
    /**
     * 
     * @type {{ [key: string]: InlineResponse200Chapters; }}
     * @memberof InlineResponse200Volumes
     */
    chapters?: { [key: string]: InlineResponse200Chapters; };
}
/**
 * 
 * @export
 * @interface Login
 */
export interface Login {
    /**
     * 
     * @type {string}
     * @memberof Login
     */
    username: string;
    /**
     * 
     * @type {string}
     * @memberof Login
     */
    password: string;
}
/**
 * 
 * @export
 * @interface LoginResponse
 */
export interface LoginResponse {
    /**
     * 
     * @type {string}
     * @memberof LoginResponse
     */
    result: LoginResponseResultEnum;
    /**
     * 
     * @type {LoginResponseToken}
     * @memberof LoginResponse
     */
    token: LoginResponseToken;
}

/**
    * @export
    * @enum {string}
    */
export enum LoginResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface LoginResponseToken
 */
export interface LoginResponseToken {
    /**
     * 
     * @type {string}
     * @memberof LoginResponseToken
     */
    session: string;
    /**
     * 
     * @type {string}
     * @memberof LoginResponseToken
     */
    refresh: string;
}
/**
 * 
 * @export
 * @interface LogoutResponse
 */
export interface LogoutResponse {
    /**
     * 
     * @type {string}
     * @memberof LogoutResponse
     */
    result: LogoutResponseResultEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum LogoutResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface Manga
 */
export interface Manga {
    /**
     * 
     * @type {string}
     * @memberof Manga
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Manga
     */
    type?: MangaTypeEnum;
    /**
     * 
     * @type {MangaAttributes}
     * @memberof Manga
     */
    attributes?: MangaAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum MangaTypeEnum {
    Manga = 'manga'
}

/**
 * 
 * @export
 * @interface MangaAttributes
 */
export interface MangaAttributes {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaAttributes
     */
    title?: { [key: string]: string; };
    /**
     * 
     * @type {Array<{ [key: string]: string; }>}
     * @memberof MangaAttributes
     */
    altTitles?: Array<{ [key: string]: string; }>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaAttributes
     */
    description?: { [key: string]: string; };
    /**
     * 
     * @type {boolean}
     * @memberof MangaAttributes
     */
    isLocked?: boolean;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaAttributes
     */
    links?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    originalLanguage?: string;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    lastVolume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    lastChapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    publicationDemographic?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    status?: string | null;
    /**
     * Year of release
     * @type {number}
     * @memberof MangaAttributes
     */
    year?: number | null;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    contentRating?: string | null;
    /**
     * 
     * @type {Array<Tag>}
     * @memberof MangaAttributes
     */
    tags?: Array<Tag>;
    /**
     * 
     * @type {number}
     * @memberof MangaAttributes
     */
    version?: number;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    createdAt?: string;
    /**
     * 
     * @type {string}
     * @memberof MangaAttributes
     */
    updatedAt?: string;
}
/**
 * 
 * @export
 * @interface MangaCreate
 */
export interface MangaCreate {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaCreate
     */
    title: { [key: string]: string; };
    /**
     * 
     * @type {Array<{ [key: string]: string; }>}
     * @memberof MangaCreate
     */
    altTitles?: Array<{ [key: string]: string; }>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaCreate
     */
    description?: { [key: string]: string; };
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaCreate
     */
    authors?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaCreate
     */
    artists?: Array<string>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaCreate
     */
    links?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    originalLanguage?: string;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    lastVolume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    lastChapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    publicationDemographic?: MangaCreatePublicationDemographicEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    status?: MangaCreateStatusEnum;
    /**
     * Year of release
     * @type {number}
     * @memberof MangaCreate
     */
    year?: number | null;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    contentRating?: MangaCreateContentRatingEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaCreate
     */
    modNotes?: string | null;
    /**
     * 
     * @type {number}
     * @memberof MangaCreate
     */
    version?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum MangaCreatePublicationDemographicEnum {
    Shounen = 'shounen',
    Shoujo = 'shoujo',
    Josei = 'josei',
    Seinen = 'seinen'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaCreateStatusEnum {
    Ongoing = 'ongoing',
    Completed = 'completed',
    Hiatus = 'hiatus',
    Cancelled = 'cancelled'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaCreateContentRatingEnum {
    Safe = 'safe',
    Suggestive = 'suggestive',
    Erotica = 'erotica',
    Pornographic = 'pornographic'
}

/**
 * 
 * @export
 * @interface MangaEdit
 */
export interface MangaEdit {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaEdit
     */
    title?: { [key: string]: string; };
    /**
     * 
     * @type {Array<{ [key: string]: string; }>}
     * @memberof MangaEdit
     */
    altTitles?: Array<{ [key: string]: string; }>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaEdit
     */
    description?: { [key: string]: string; };
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaEdit
     */
    authors?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaEdit
     */
    artists?: Array<string>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaEdit
     */
    links?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    originalLanguage?: string;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    lastVolume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    lastChapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    publicationDemographic?: MangaEditPublicationDemographicEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    status?: MangaEditStatusEnum;
    /**
     * Year of release
     * @type {number}
     * @memberof MangaEdit
     */
    year?: number | null;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    contentRating?: MangaEditContentRatingEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaEdit
     */
    modNotes?: string | null;
    /**
     * 
     * @type {number}
     * @memberof MangaEdit
     */
    version: number;
}

/**
    * @export
    * @enum {string}
    */
export enum MangaEditPublicationDemographicEnum {
    Shounen = 'shounen',
    Shoujo = 'shoujo',
    Josei = 'josei',
    Seinen = 'seinen'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaEditStatusEnum {
    Ongoing = 'ongoing',
    Completed = 'completed',
    Hiatus = 'hiatus',
    Cancelled = 'cancelled'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaEditContentRatingEnum {
    Safe = 'safe',
    Suggestive = 'suggestive',
    Erotica = 'erotica',
    Pornographic = 'pornographic'
}

/**
 * 
 * @export
 * @interface MangaList
 */
export interface MangaList {
    /**
     * 
     * @type {Array<MangaResponse>}
     * @memberof MangaList
     */
    results?: Array<MangaResponse>;
    /**
     * 
     * @type {number}
     * @memberof MangaList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof MangaList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof MangaList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface MangaRequest
 */
export interface MangaRequest {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaRequest
     */
    title?: { [key: string]: string; };
    /**
     * 
     * @type {Array<{ [key: string]: string; }>}
     * @memberof MangaRequest
     */
    altTitles?: Array<{ [key: string]: string; }>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaRequest
     */
    description?: { [key: string]: string; };
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaRequest
     */
    authors?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof MangaRequest
     */
    artists?: Array<string>;
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof MangaRequest
     */
    links?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    originalLanguage?: string;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    lastVolume?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    lastChapter?: string | null;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    publicationDemographic?: MangaRequestPublicationDemographicEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    status?: MangaRequestStatusEnum;
    /**
     * Year of release
     * @type {number}
     * @memberof MangaRequest
     */
    year?: number | null;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    contentRating?: MangaRequestContentRatingEnum;
    /**
     * 
     * @type {string}
     * @memberof MangaRequest
     */
    modNotes?: string | null;
    /**
     * 
     * @type {number}
     * @memberof MangaRequest
     */
    version?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum MangaRequestPublicationDemographicEnum {
    Shounen = 'shounen',
    Shoujo = 'shoujo',
    Josei = 'josei',
    Seinen = 'seinen'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaRequestStatusEnum {
    Ongoing = 'ongoing',
    Completed = 'completed',
    Hiatus = 'hiatus',
    Cancelled = 'cancelled'
}
/**
    * @export
    * @enum {string}
    */
export enum MangaRequestContentRatingEnum {
    Safe = 'safe',
    Suggestive = 'suggestive',
    Erotica = 'erotica',
    Pornographic = 'pornographic'
}

/**
 * 
 * @export
 * @interface MangaResponse
 */
export interface MangaResponse {
    /**
     * 
     * @type {string}
     * @memberof MangaResponse
     */
    result: MangaResponseResultEnum;
    /**
     * 
     * @type {Manga}
     * @memberof MangaResponse
     */
    data: Manga;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof MangaResponse
     */
    relationships: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum MangaResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface MappingId
 */
export interface MappingId {
    /**
     * 
     * @type {string}
     * @memberof MappingId
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof MappingId
     */
    type?: MappingIdTypeEnum;
    /**
     * 
     * @type {MappingIdAttributes}
     * @memberof MappingId
     */
    attributes?: MappingIdAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum MappingIdTypeEnum {
    MappingId = 'mapping_id'
}

/**
 * 
 * @export
 * @interface MappingIdAttributes
 */
export interface MappingIdAttributes {
    /**
     * 
     * @type {string}
     * @memberof MappingIdAttributes
     */
    type?: MappingIdAttributesTypeEnum;
    /**
     * 
     * @type {number}
     * @memberof MappingIdAttributes
     */
    legacyId?: number;
    /**
     * 
     * @type {string}
     * @memberof MappingIdAttributes
     */
    newId?: string;
}

/**
    * @export
    * @enum {string}
    */
export enum MappingIdAttributesTypeEnum {
    Manga = 'manga',
    Chapter = 'chapter',
    Group = 'group',
    Tag = 'tag'
}

/**
 * 
 * @export
 * @interface MappingIdBody
 */
export interface MappingIdBody {
    /**
     * 
     * @type {string}
     * @memberof MappingIdBody
     */
    type?: MappingIdBodyTypeEnum;
    /**
     * 
     * @type {Array<number>}
     * @memberof MappingIdBody
     */
    ids?: Array<number>;
}

/**
    * @export
    * @enum {string}
    */
export enum MappingIdBodyTypeEnum {
    Group = 'group',
    Manga = 'manga',
    Chapter = 'chapter',
    Tag = 'tag'
}

/**
 * 
 * @export
 * @interface MappingIdResponse
 */
export interface MappingIdResponse {
    /**
     * 
     * @type {string}
     * @memberof MappingIdResponse
     */
    result?: MappingIdResponseResultEnum;
    /**
     * 
     * @type {MappingId}
     * @memberof MappingIdResponse
     */
    data?: MappingId;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof MappingIdResponse
     */
    relationships?: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum MappingIdResponseResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface ModelError
 */
export interface ModelError {
    /**
     * 
     * @type {string}
     * @memberof ModelError
     */
    id?: string;
    /**
     * 
     * @type {number}
     * @memberof ModelError
     */
    status?: number;
    /**
     * 
     * @type {string}
     * @memberof ModelError
     */
    title?: string;
    /**
     * 
     * @type {string}
     * @memberof ModelError
     */
    detail?: string;
}
/**
 * 
 * @export
 * @interface Order
 */
export interface Order {
    /**
     * 
     * @type {string}
     * @memberof Order
     */
    createdAt?: OrderCreatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order
     */
    updatedAt?: OrderUpdatedAtEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum OrderCreatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum OrderUpdatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order1
 */
export interface Order1 {
    /**
     * 
     * @type {string}
     * @memberof Order1
     */
    createdAt?: Order1CreatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order1
     */
    updatedAt?: Order1UpdatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order1
     */
    publishAt?: Order1PublishAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order1
     */
    volume?: Order1VolumeEnum;
    /**
     * 
     * @type {string}
     * @memberof Order1
     */
    chapter?: Order1ChapterEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order1CreatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order1UpdatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order1PublishAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order1VolumeEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order1ChapterEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order2
 */
export interface Order2 {
    /**
     * 
     * @type {string}
     * @memberof Order2
     */
    createdAt?: Order2CreatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order2
     */
    updatedAt?: Order2UpdatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order2
     */
    publishAt?: Order2PublishAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order2
     */
    volume?: Order2VolumeEnum;
    /**
     * 
     * @type {string}
     * @memberof Order2
     */
    chapter?: Order2ChapterEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order2CreatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order2UpdatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order2PublishAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order2VolumeEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order2ChapterEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order3
 */
export interface Order3 {
    /**
     * 
     * @type {string}
     * @memberof Order3
     */
    volume?: Order3VolumeEnum;
    /**
     * 
     * @type {string}
     * @memberof Order3
     */
    chapter?: Order3ChapterEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order3VolumeEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order3ChapterEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order4
 */
export interface Order4 {
    /**
     * 
     * @type {string}
     * @memberof Order4
     */
    createdAt?: Order4CreatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order4
     */
    updatedAt?: Order4UpdatedAtEnum;
    /**
     * 
     * @type {string}
     * @memberof Order4
     */
    volume?: Order4VolumeEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order4CreatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order4UpdatedAtEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order4VolumeEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order5
 */
export interface Order5 {
    /**
     * 
     * @type {string}
     * @memberof Order5
     */
    name?: Order5NameEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order5NameEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface Order6
 */
export interface Order6 {
    /**
     * 
     * @type {string}
     * @memberof Order6
     */
    volume?: Order6VolumeEnum;
    /**
     * 
     * @type {string}
     * @memberof Order6
     */
    chapter?: Order6ChapterEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum Order6VolumeEnum {
    Asc = 'asc',
    Desc = 'desc'
}
/**
    * @export
    * @enum {string}
    */
export enum Order6ChapterEnum {
    Asc = 'asc',
    Desc = 'desc'
}

/**
 * 
 * @export
 * @interface RecoverCompleteBody
 */
export interface RecoverCompleteBody {
    /**
     * 
     * @type {string}
     * @memberof RecoverCompleteBody
     */
    newPassword: string;
}
/**
 * 
 * @export
 * @interface RefreshResponse
 */
export interface RefreshResponse {
    /**
     * 
     * @type {string}
     * @memberof RefreshResponse
     */
    result: RefreshResponseResultEnum;
    /**
     * 
     * @type {LoginResponseToken}
     * @memberof RefreshResponse
     */
    token: LoginResponseToken;
    /**
     * 
     * @type {string}
     * @memberof RefreshResponse
     */
    message: string;
}

/**
    * @export
    * @enum {string}
    */
export enum RefreshResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface RefreshToken
 */
export interface RefreshToken {
    /**
     * 
     * @type {string}
     * @memberof RefreshToken
     */
    token: string;
}
/**
 * 
 * @export
 * @interface Relationship
 */
export interface Relationship {
    /**
     * 
     * @type {string}
     * @memberof Relationship
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Relationship
     */
    type?: string;
}
/**
 * 
 * @export
 * @interface Response
 */
export interface Response {
    /**
     * 
     * @type {string}
     * @memberof Response
     */
    result?: ResponseResultEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum ResponseResultEnum {
    Ok = 'ok',
    Error = 'error'
}

/**
 * 
 * @export
 * @interface ScanlationGroup
 */
export interface ScanlationGroup {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroup
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroup
     */
    type?: ScanlationGroupTypeEnum;
    /**
     * 
     * @type {ScanlationGroupAttributes}
     * @memberof ScanlationGroup
     */
    attributes?: ScanlationGroupAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum ScanlationGroupTypeEnum {
    ScanlationGroup = 'scanlation_group'
}

/**
 * 
 * @export
 * @interface ScanlationGroupAttributes
 */
export interface ScanlationGroupAttributes {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupAttributes
     */
    name?: string;
    /**
     * 
     * @type {User}
     * @memberof ScanlationGroupAttributes
     */
    leader?: User;
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupAttributes
     */
    version?: number;
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupAttributes
     */
    createdAt?: string;
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupAttributes
     */
    updatedAt?: string;
}
/**
 * 
 * @export
 * @interface ScanlationGroupEdit
 */
export interface ScanlationGroupEdit {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupEdit
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupEdit
     */
    leader?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof ScanlationGroupEdit
     */
    members?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupEdit
     */
    version: number;
}
/**
 * 
 * @export
 * @interface ScanlationGroupList
 */
export interface ScanlationGroupList {
    /**
     * 
     * @type {Array<ScanlationGroupResponse>}
     * @memberof ScanlationGroupList
     */
    results?: Array<ScanlationGroupResponse>;
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface ScanlationGroupResponse
 */
export interface ScanlationGroupResponse {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupResponse
     */
    result?: ScanlationGroupResponseResultEnum;
    /**
     * 
     * @type {ScanlationGroup}
     * @memberof ScanlationGroupResponse
     */
    data?: ScanlationGroup;
    /**
     * 
     * @type {Array<ScanlationGroupResponseRelationships>}
     * @memberof ScanlationGroupResponse
     */
    relationships?: Array<ScanlationGroupResponseRelationships>;
}

/**
    * @export
    * @enum {string}
    */
export enum ScanlationGroupResponseResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface ScanlationGroupResponseRelationships
 */
export interface ScanlationGroupResponseRelationships {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupResponseRelationships
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupResponseRelationships
     */
    type?: string;
}
/**
 * 
 * @export
 * @interface SendAccountActivationCode
 */
export interface SendAccountActivationCode {
    /**
     * 
     * @type {string}
     * @memberof SendAccountActivationCode
     */
    email: string;
}
/**
 * 
 * @export
 * @interface Tag
 */
export interface Tag {
    /**
     * 
     * @type {string}
     * @memberof Tag
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof Tag
     */
    type?: TagTypeEnum;
    /**
     * 
     * @type {TagAttributes}
     * @memberof Tag
     */
    attributes?: TagAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum TagTypeEnum {
    Tag = 'tag'
}

/**
 * 
 * @export
 * @interface TagAttributes
 */
export interface TagAttributes {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof TagAttributes
     */
    name?: { [key: string]: string; };
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof TagAttributes
     */
    description?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof TagAttributes
     */
    group?: string;
    /**
     * 
     * @type {number}
     * @memberof TagAttributes
     */
    version?: number;
}
/**
 * 
 * @export
 * @interface TagResponse
 */
export interface TagResponse {
    /**
     * 
     * @type {string}
     * @memberof TagResponse
     */
    result?: TagResponseResultEnum;
    /**
     * 
     * @type {Tag}
     * @memberof TagResponse
     */
    data?: Tag;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof TagResponse
     */
    relationships?: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum TagResponseResultEnum {
    Ok = 'ok'
}

/**
 * 
 * @export
 * @interface UpdateMangaStatus
 */
export interface UpdateMangaStatus {
    /**
     * 
     * @type {string}
     * @memberof UpdateMangaStatus
     */
    status: UpdateMangaStatusStatusEnum;
}

/**
    * @export
    * @enum {string}
    */
export enum UpdateMangaStatusStatusEnum {
    Reading = 'reading',
    OnHold = 'on_hold',
    PlanToRead = 'plan_to_read',
    Dropped = 'dropped',
    ReReading = 're_reading',
    Completed = 'completed'
}

/**
 * 
 * @export
 * @interface User
 */
export interface User {
    /**
     * 
     * @type {string}
     * @memberof User
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof User
     */
    type?: UserTypeEnum;
    /**
     * 
     * @type {UserAttributes}
     * @memberof User
     */
    attributes?: UserAttributes;
}

/**
    * @export
    * @enum {string}
    */
export enum UserTypeEnum {
    User = 'user'
}

/**
 * 
 * @export
 * @interface UserAttributes
 */
export interface UserAttributes {
    /**
     * 
     * @type {string}
     * @memberof UserAttributes
     */
    username?: string;
    /**
     * 
     * @type {number}
     * @memberof UserAttributes
     */
    version?: number;
}
/**
 * 
 * @export
 * @interface UserList
 */
export interface UserList {
    /**
     * 
     * @type {Array<UserResponse>}
     * @memberof UserList
     */
    results?: Array<UserResponse>;
    /**
     * 
     * @type {number}
     * @memberof UserList
     */
    limit?: number;
    /**
     * 
     * @type {number}
     * @memberof UserList
     */
    offset?: number;
    /**
     * 
     * @type {number}
     * @memberof UserList
     */
    total?: number;
}
/**
 * 
 * @export
 * @interface UserResponse
 */
export interface UserResponse {
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    result?: UserResponseResultEnum;
    /**
     * 
     * @type {User}
     * @memberof UserResponse
     */
    data?: User;
    /**
     * 
     * @type {Array<Relationship>}
     * @memberof UserResponse
     */
    relationships?: Array<Relationship>;
}

/**
    * @export
    * @enum {string}
    */
export enum UserResponseResultEnum {
    Ok = 'ok'
}


/**
 * AccountApi - axios parameter creator
 * @export
 */
export const AccountApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Activate account
         * @param {string} code 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountActivateCode: async (code: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'code' is not null or undefined
            assertParamExists('getAccountActivateCode', 'code', code)
            const localVarPath = `/account/activate/{code}`
                .replace(`{${"code"}}`, encodeURIComponent(String(code)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Resend Activation code
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountActivateResend: async (sendAccountActivationCode?: SendAccountActivationCode, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/account/activate/resend`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(sendAccountActivationCode, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Create Account
         * @param {CreateAccount} [createAccount] The size of the body is limited to 4KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountCreate: async (createAccount?: CreateAccount, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/account/create`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(createAccount, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Recover given Account
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountRecover: async (sendAccountActivationCode?: SendAccountActivationCode, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/account/recover`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(sendAccountActivationCode, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Complete Account recover
         * @param {string} code 
         * @param {RecoverCompleteBody} [recoverCompleteBody] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountRecoverCode: async (code: string, recoverCompleteBody?: RecoverCompleteBody, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'code' is not null or undefined
            assertParamExists('postAccountRecoverCode', 'code', code)
            const localVarPath = `/account/recover/{code}`
                .replace(`{${"code"}}`, encodeURIComponent(String(code)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(recoverCompleteBody, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * AccountApi - functional programming interface
 * @export
 */
export const AccountApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = AccountApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Activate account
         * @param {string} code 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAccountActivateCode(code: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AccountActivateResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAccountActivateCode(code, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Resend Activation code
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAccountActivateResend(sendAccountActivationCode?: SendAccountActivationCode, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AccountActivateResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAccountActivateResend(sendAccountActivationCode, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Create Account
         * @param {CreateAccount} [createAccount] The size of the body is limited to 4KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAccountCreate(createAccount?: CreateAccount, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<UserResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAccountCreate(createAccount, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Recover given Account
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAccountRecover(sendAccountActivationCode?: SendAccountActivationCode, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AccountActivateResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAccountRecover(sendAccountActivationCode, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Complete Account recover
         * @param {string} code 
         * @param {RecoverCompleteBody} [recoverCompleteBody] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAccountRecoverCode(code: string, recoverCompleteBody?: RecoverCompleteBody, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AccountActivateResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAccountRecoverCode(code, recoverCompleteBody, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * AccountApi - factory interface
 * @export
 */
export const AccountApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = AccountApiFp(configuration)
    return {
        /**
         * 
         * @summary Activate account
         * @param {string} code 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAccountActivateCode(code: string, options?: any): AxiosPromise<AccountActivateResponse> {
            return localVarFp.getAccountActivateCode(code, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Resend Activation code
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountActivateResend(sendAccountActivationCode?: SendAccountActivationCode, options?: any): AxiosPromise<AccountActivateResponse> {
            return localVarFp.postAccountActivateResend(sendAccountActivationCode, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Create Account
         * @param {CreateAccount} [createAccount] The size of the body is limited to 4KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountCreate(createAccount?: CreateAccount, options?: any): AxiosPromise<UserResponse> {
            return localVarFp.postAccountCreate(createAccount, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Recover given Account
         * @param {SendAccountActivationCode} [sendAccountActivationCode] The size of the body is limited to 1KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountRecover(sendAccountActivationCode?: SendAccountActivationCode, options?: any): AxiosPromise<AccountActivateResponse> {
            return localVarFp.postAccountRecover(sendAccountActivationCode, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Complete Account recover
         * @param {string} code 
         * @param {RecoverCompleteBody} [recoverCompleteBody] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAccountRecoverCode(code: string, recoverCompleteBody?: RecoverCompleteBody, options?: any): AxiosPromise<AccountActivateResponse> {
            return localVarFp.postAccountRecoverCode(code, recoverCompleteBody, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for getAccountActivateCode operation in AccountApi.
 * @export
 * @interface AccountApiGetAccountActivateCodeRequest
 */
export interface AccountApiGetAccountActivateCodeRequest {
    /**
     * 
     * @type {string}
     * @memberof AccountApiGetAccountActivateCode
     */
    readonly code: string
}

/**
 * Request parameters for postAccountActivateResend operation in AccountApi.
 * @export
 * @interface AccountApiPostAccountActivateResendRequest
 */
export interface AccountApiPostAccountActivateResendRequest {
    /**
     * The size of the body is limited to 1KB.
     * @type {SendAccountActivationCode}
     * @memberof AccountApiPostAccountActivateResend
     */
    readonly sendAccountActivationCode?: SendAccountActivationCode
}

/**
 * Request parameters for postAccountCreate operation in AccountApi.
 * @export
 * @interface AccountApiPostAccountCreateRequest
 */
export interface AccountApiPostAccountCreateRequest {
    /**
     * The size of the body is limited to 4KB.
     * @type {CreateAccount}
     * @memberof AccountApiPostAccountCreate
     */
    readonly createAccount?: CreateAccount
}

/**
 * Request parameters for postAccountRecover operation in AccountApi.
 * @export
 * @interface AccountApiPostAccountRecoverRequest
 */
export interface AccountApiPostAccountRecoverRequest {
    /**
     * The size of the body is limited to 1KB.
     * @type {SendAccountActivationCode}
     * @memberof AccountApiPostAccountRecover
     */
    readonly sendAccountActivationCode?: SendAccountActivationCode
}

/**
 * Request parameters for postAccountRecoverCode operation in AccountApi.
 * @export
 * @interface AccountApiPostAccountRecoverCodeRequest
 */
export interface AccountApiPostAccountRecoverCodeRequest {
    /**
     * 
     * @type {string}
     * @memberof AccountApiPostAccountRecoverCode
     */
    readonly code: string

    /**
     * The size of the body is limited to 2KB.
     * @type {RecoverCompleteBody}
     * @memberof AccountApiPostAccountRecoverCode
     */
    readonly recoverCompleteBody?: RecoverCompleteBody
}

/**
 * AccountApi - object-oriented interface
 * @export
 * @class AccountApi
 * @extends {BaseAPI}
 */
export class AccountApi extends BaseAPI {
    /**
     * 
     * @summary Activate account
     * @param {AccountApiGetAccountActivateCodeRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountApi
     */
    public getAccountActivateCode(requestParameters: AccountApiGetAccountActivateCodeRequest, options?: any) {
        return AccountApiFp(this.configuration).getAccountActivateCode(requestParameters.code, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Resend Activation code
     * @param {AccountApiPostAccountActivateResendRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountApi
     */
    public postAccountActivateResend(requestParameters: AccountApiPostAccountActivateResendRequest = {}, options?: any) {
        return AccountApiFp(this.configuration).postAccountActivateResend(requestParameters.sendAccountActivationCode, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Create Account
     * @param {AccountApiPostAccountCreateRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountApi
     */
    public postAccountCreate(requestParameters: AccountApiPostAccountCreateRequest = {}, options?: any) {
        return AccountApiFp(this.configuration).postAccountCreate(requestParameters.createAccount, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Recover given Account
     * @param {AccountApiPostAccountRecoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountApi
     */
    public postAccountRecover(requestParameters: AccountApiPostAccountRecoverRequest = {}, options?: any) {
        return AccountApiFp(this.configuration).postAccountRecover(requestParameters.sendAccountActivationCode, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Complete Account recover
     * @param {AccountApiPostAccountRecoverCodeRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AccountApi
     */
    public postAccountRecoverCode(requestParameters: AccountApiPostAccountRecoverCodeRequest, options?: any) {
        return AccountApiFp(this.configuration).postAccountRecoverCode(requestParameters.code, requestParameters.recoverCompleteBody, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * AtHomeApi - axios parameter creator
 * @export
 */
export const AtHomeApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Get MangaDex@Home server URL
         * @param {string} chapterId Chapter ID
         * @param {boolean} [forcePort443] Force selecting from MangaDex@Home servers that use the standard HTTPS port 443.  While the conventional port for HTTPS traffic is 443 and servers are encouraged to use it, it is not a hard requirement as it technically isn\&#39;t anything special.  However, some misbehaving school/office network will at time block traffic to non-standard ports, and setting this flag to &#x60;true&#x60; will ensure selection of a server that uses these.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAtHomeServerChapterId: async (chapterId: string, forcePort443?: boolean, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'chapterId' is not null or undefined
            assertParamExists('getAtHomeServerChapterId', 'chapterId', chapterId)
            const localVarPath = `/at-home/server/{chapterId}`
                .replace(`{${"chapterId"}}`, encodeURIComponent(String(chapterId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (forcePort443 !== undefined) {
                localVarQueryParameter['forcePort443'] = forcePort443;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * AtHomeApi - functional programming interface
 * @export
 */
export const AtHomeApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = AtHomeApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Get MangaDex@Home server URL
         * @param {string} chapterId Chapter ID
         * @param {boolean} [forcePort443] Force selecting from MangaDex@Home servers that use the standard HTTPS port 443.  While the conventional port for HTTPS traffic is 443 and servers are encouraged to use it, it is not a hard requirement as it technically isn\&#39;t anything special.  However, some misbehaving school/office network will at time block traffic to non-standard ports, and setting this flag to &#x60;true&#x60; will ensure selection of a server that uses these.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAtHomeServerChapterId(chapterId: string, forcePort443?: boolean, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2004>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAtHomeServerChapterId(chapterId, forcePort443, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * AtHomeApi - factory interface
 * @export
 */
export const AtHomeApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = AtHomeApiFp(configuration)
    return {
        /**
         * 
         * @summary Get MangaDex@Home server URL
         * @param {string} chapterId Chapter ID
         * @param {boolean} [forcePort443] Force selecting from MangaDex@Home servers that use the standard HTTPS port 443.  While the conventional port for HTTPS traffic is 443 and servers are encouraged to use it, it is not a hard requirement as it technically isn\&#39;t anything special.  However, some misbehaving school/office network will at time block traffic to non-standard ports, and setting this flag to &#x60;true&#x60; will ensure selection of a server that uses these.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAtHomeServerChapterId(chapterId: string, forcePort443?: boolean, options?: any): AxiosPromise<InlineResponse2004> {
            return localVarFp.getAtHomeServerChapterId(chapterId, forcePort443, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for getAtHomeServerChapterId operation in AtHomeApi.
 * @export
 * @interface AtHomeApiGetAtHomeServerChapterIdRequest
 */
export interface AtHomeApiGetAtHomeServerChapterIdRequest {
    /**
     * Chapter ID
     * @type {string}
     * @memberof AtHomeApiGetAtHomeServerChapterId
     */
    readonly chapterId: string

    /**
     * Force selecting from MangaDex@Home servers that use the standard HTTPS port 443.  While the conventional port for HTTPS traffic is 443 and servers are encouraged to use it, it is not a hard requirement as it technically isn\&#39;t anything special.  However, some misbehaving school/office network will at time block traffic to non-standard ports, and setting this flag to &#x60;true&#x60; will ensure selection of a server that uses these.
     * @type {boolean}
     * @memberof AtHomeApiGetAtHomeServerChapterId
     */
    readonly forcePort443?: boolean
}

/**
 * AtHomeApi - object-oriented interface
 * @export
 * @class AtHomeApi
 * @extends {BaseAPI}
 */
export class AtHomeApi extends BaseAPI {
    /**
     * 
     * @summary Get MangaDex@Home server URL
     * @param {AtHomeApiGetAtHomeServerChapterIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AtHomeApi
     */
    public getAtHomeServerChapterId(requestParameters: AtHomeApiGetAtHomeServerChapterIdRequest, options?: any) {
        return AtHomeApiFp(this.configuration).getAtHomeServerChapterId(requestParameters.chapterId, requestParameters.forcePort443, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * AuthApi - axios parameter creator
 * @export
 */
export const AuthApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Check token
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthCheck: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/auth/check`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Login
         * @param {Login} [login] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthLogin: async (login?: Login, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/auth/login`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(login, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthLogout: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/auth/logout`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Refresh token
         * @param {RefreshToken} [refreshToken] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthRefresh: async (refreshToken?: RefreshToken, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/auth/refresh`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(refreshToken, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * AuthApi - functional programming interface
 * @export
 */
export const AuthApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = AuthApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Check token
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAuthCheck(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CheckResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAuthCheck(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Login
         * @param {Login} [login] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAuthLogin(login?: Login, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<LoginResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAuthLogin(login, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAuthLogout(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<LogoutResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAuthLogout(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Refresh token
         * @param {RefreshToken} [refreshToken] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAuthRefresh(refreshToken?: RefreshToken, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<RefreshResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAuthRefresh(refreshToken, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * AuthApi - factory interface
 * @export
 */
export const AuthApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = AuthApiFp(configuration)
    return {
        /**
         * 
         * @summary Check token
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthCheck(options?: any): AxiosPromise<CheckResponse> {
            return localVarFp.getAuthCheck(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Login
         * @param {Login} [login] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthLogin(login?: Login, options?: any): AxiosPromise<LoginResponse> {
            return localVarFp.postAuthLogin(login, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Logout
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthLogout(options?: any): AxiosPromise<LogoutResponse> {
            return localVarFp.postAuthLogout(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Refresh token
         * @param {RefreshToken} [refreshToken] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthRefresh(refreshToken?: RefreshToken, options?: any): AxiosPromise<RefreshResponse> {
            return localVarFp.postAuthRefresh(refreshToken, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for postAuthLogin operation in AuthApi.
 * @export
 * @interface AuthApiPostAuthLoginRequest
 */
export interface AuthApiPostAuthLoginRequest {
    /**
     * The size of the body is limited to 2KB.
     * @type {Login}
     * @memberof AuthApiPostAuthLogin
     */
    readonly login?: Login
}

/**
 * Request parameters for postAuthRefresh operation in AuthApi.
 * @export
 * @interface AuthApiPostAuthRefreshRequest
 */
export interface AuthApiPostAuthRefreshRequest {
    /**
     * The size of the body is limited to 2KB.
     * @type {RefreshToken}
     * @memberof AuthApiPostAuthRefresh
     */
    readonly refreshToken: RefreshToken
}

/**
 * AuthApi - object-oriented interface
 * @export
 * @class AuthApi
 * @extends {BaseAPI}
 */
export class AuthApi extends BaseAPI {
    /**
     * 
     * @summary Check token
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthApi
     */
    public getAuthCheck(options?: any) {
        return AuthApiFp(this.configuration).getAuthCheck(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Login
     * @param {AuthApiPostAuthLoginRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthApi
     */
    public postAuthLogin(requestParameters: AuthApiPostAuthLoginRequest = {}, options?: any) {
        return AuthApiFp(this.configuration).postAuthLogin(requestParameters.login, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Logout
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthApi
     */
    public postAuthLogout(options?: any) {
        return AuthApiFp(this.configuration).postAuthLogout(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Refresh token
     * @param {AuthApiPostAuthRefreshRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthApi
     */
    public postAuthRefresh(requestParameters: AuthApiPostAuthRefreshRequest, options?: any) {
        return AuthApiFp(this.configuration).postAuthRefresh(requestParameters.refreshToken, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * AuthorApi - axios parameter creator
 * @export
 */
export const AuthorApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Delete Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteAuthorId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteAuthorId', 'id', id)
            const localVarPath = `/author/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthor: async (limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/author`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (name !== undefined) {
                localVarQueryParameter['name'] = name;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthorId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getAuthorId', 'id', id)
            const localVarPath = `/author/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Create Author
         * @param {AuthorCreate} [authorCreate] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthor: async (authorCreate?: AuthorCreate, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/author`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(authorCreate, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Update Author
         * @param {string} id Author ID
         * @param {AuthorEdit} [authorEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putAuthorId: async (id: string, authorEdit?: AuthorEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('putAuthorId', 'id', id)
            const localVarPath = `/author/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(authorEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * AuthorApi - functional programming interface
 * @export
 */
export const AuthorApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = AuthorApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Delete Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteAuthorId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteAuthorId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAuthor(limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAuthor(limit, offset, ids, name, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAuthorId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAuthorId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Create Author
         * @param {AuthorCreate} [authorCreate] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postAuthor(authorCreate?: AuthorCreate, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postAuthor(authorCreate, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Update Author
         * @param {string} id Author ID
         * @param {AuthorEdit} [authorEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async putAuthorId(id: string, authorEdit?: AuthorEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.putAuthorId(id, authorEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * AuthorApi - factory interface
 * @export
 */
export const AuthorApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = AuthorApiFp(configuration)
    return {
        /**
         * 
         * @summary Delete Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteAuthorId(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteAuthorId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthor(limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options?: any): AxiosPromise<AuthorList> {
            return localVarFp.getAuthor(limit, offset, ids, name, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get Author
         * @param {string} id Author ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthorId(id: string, options?: any): AxiosPromise<AuthorResponse> {
            return localVarFp.getAuthorId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Create Author
         * @param {AuthorCreate} [authorCreate] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postAuthor(authorCreate?: AuthorCreate, options?: any): AxiosPromise<AuthorResponse> {
            return localVarFp.postAuthor(authorCreate, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Update Author
         * @param {string} id Author ID
         * @param {AuthorEdit} [authorEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putAuthorId(id: string, authorEdit?: AuthorEdit, options?: any): AxiosPromise<AuthorResponse> {
            return localVarFp.putAuthorId(id, authorEdit, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for deleteAuthorId operation in AuthorApi.
 * @export
 * @interface AuthorApiDeleteAuthorIdRequest
 */
export interface AuthorApiDeleteAuthorIdRequest {
    /**
     * Author ID
     * @type {string}
     * @memberof AuthorApiDeleteAuthorId
     */
    readonly id: string
}

/**
 * Request parameters for getAuthor operation in AuthorApi.
 * @export
 * @interface AuthorApiGetAuthorRequest
 */
export interface AuthorApiGetAuthorRequest {
    /**
     * 
     * @type {number}
     * @memberof AuthorApiGetAuthor
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof AuthorApiGetAuthor
     */
    readonly offset?: number

    /**
     * Author ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof AuthorApiGetAuthor
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof AuthorApiGetAuthor
     */
    readonly name?: string

    /**
     * 
     * @type {object}
     * @memberof AuthorApiGetAuthor
     */
    readonly order?: object
}

/**
 * Request parameters for getAuthorId operation in AuthorApi.
 * @export
 * @interface AuthorApiGetAuthorIdRequest
 */
export interface AuthorApiGetAuthorIdRequest {
    /**
     * Author ID
     * @type {string}
     * @memberof AuthorApiGetAuthorId
     */
    readonly id: string
}

/**
 * Request parameters for postAuthor operation in AuthorApi.
 * @export
 * @interface AuthorApiPostAuthorRequest
 */
export interface AuthorApiPostAuthorRequest {
    /**
     * The size of the body is limited to 2KB.
     * @type {AuthorCreate}
     * @memberof AuthorApiPostAuthor
     */
    readonly authorCreate?: AuthorCreate
}

/**
 * Request parameters for putAuthorId operation in AuthorApi.
 * @export
 * @interface AuthorApiPutAuthorIdRequest
 */
export interface AuthorApiPutAuthorIdRequest {
    /**
     * Author ID
     * @type {string}
     * @memberof AuthorApiPutAuthorId
     */
    readonly id: string

    /**
     * The size of the body is limited to 2KB.
     * @type {AuthorEdit}
     * @memberof AuthorApiPutAuthorId
     */
    readonly authorEdit?: AuthorEdit
}

/**
 * AuthorApi - object-oriented interface
 * @export
 * @class AuthorApi
 * @extends {BaseAPI}
 */
export class AuthorApi extends BaseAPI {
    /**
     * 
     * @summary Delete Author
     * @param {AuthorApiDeleteAuthorIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthorApi
     */
    public deleteAuthorId(requestParameters: AuthorApiDeleteAuthorIdRequest, options?: any) {
        return AuthorApiFp(this.configuration).deleteAuthorId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Author list
     * @param {AuthorApiGetAuthorRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthorApi
     */
    public getAuthor(requestParameters: AuthorApiGetAuthorRequest = {}, options?: any) {
        return AuthorApiFp(this.configuration).getAuthor(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.name, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get Author
     * @param {AuthorApiGetAuthorIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthorApi
     */
    public getAuthorId(requestParameters: AuthorApiGetAuthorIdRequest, options?: any) {
        return AuthorApiFp(this.configuration).getAuthorId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Create Author
     * @param {AuthorApiPostAuthorRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthorApi
     */
    public postAuthor(requestParameters: AuthorApiPostAuthorRequest = {}, options?: any) {
        return AuthorApiFp(this.configuration).postAuthor(requestParameters.authorCreate, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Update Author
     * @param {AuthorApiPutAuthorIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof AuthorApi
     */
    public putAuthorId(requestParameters: AuthorApiPutAuthorIdRequest, options?: any) {
        return AuthorApiFp(this.configuration).putAuthorId(requestParameters.id, requestParameters.authorEdit, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * CaptchaApi - axios parameter creator
 * @export
 */
export const CaptchaApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Captchas can be solved explicitly through this endpoint, another way is to add a `X-Captcha-Result` header to any request. The same logic will verify the captcha and is probably more convenient because it takes one less request.  Authentication is optional. Captchas are tracked for both the client ip and for the user id, if you are logged in you want to send your session token but that is not required.
         * @summary Solve Captcha
         * @param {InlineObject1} [inlineObject1] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postCaptchaSolve: async (inlineObject1?: InlineObject1, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/captcha/solve`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(inlineObject1, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * CaptchaApi - functional programming interface
 * @export
 */
export const CaptchaApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = CaptchaApiAxiosParamCreator(configuration)
    return {
        /**
         * Captchas can be solved explicitly through this endpoint, another way is to add a `X-Captcha-Result` header to any request. The same logic will verify the captcha and is probably more convenient because it takes one less request.  Authentication is optional. Captchas are tracked for both the client ip and for the user id, if you are logged in you want to send your session token but that is not required.
         * @summary Solve Captcha
         * @param {InlineObject1} [inlineObject1] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postCaptchaSolve(inlineObject1?: InlineObject1, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2003>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postCaptchaSolve(inlineObject1, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * CaptchaApi - factory interface
 * @export
 */
export const CaptchaApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = CaptchaApiFp(configuration)
    return {
        /**
         * Captchas can be solved explicitly through this endpoint, another way is to add a `X-Captcha-Result` header to any request. The same logic will verify the captcha and is probably more convenient because it takes one less request.  Authentication is optional. Captchas are tracked for both the client ip and for the user id, if you are logged in you want to send your session token but that is not required.
         * @summary Solve Captcha
         * @param {InlineObject1} [inlineObject1] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postCaptchaSolve(inlineObject1?: InlineObject1, options?: any): AxiosPromise<InlineResponse2003> {
            return localVarFp.postCaptchaSolve(inlineObject1, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for postCaptchaSolve operation in CaptchaApi.
 * @export
 * @interface CaptchaApiPostCaptchaSolveRequest
 */
export interface CaptchaApiPostCaptchaSolveRequest {
    /**
     * 
     * @type {InlineObject1}
     * @memberof CaptchaApiPostCaptchaSolve
     */
    readonly inlineObject1?: InlineObject1
}

/**
 * CaptchaApi - object-oriented interface
 * @export
 * @class CaptchaApi
 * @extends {BaseAPI}
 */
export class CaptchaApi extends BaseAPI {
    /**
     * Captchas can be solved explicitly through this endpoint, another way is to add a `X-Captcha-Result` header to any request. The same logic will verify the captcha and is probably more convenient because it takes one less request.  Authentication is optional. Captchas are tracked for both the client ip and for the user id, if you are logged in you want to send your session token but that is not required.
     * @summary Solve Captcha
     * @param {CaptchaApiPostCaptchaSolveRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CaptchaApi
     */
    public postCaptchaSolve(requestParameters: CaptchaApiPostCaptchaSolveRequest = {}, options?: any) {
        return CaptchaApiFp(this.configuration).postCaptchaSolve(requestParameters.inlineObject1, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * ChapterApi - axios parameter creator
 * @export
 */
export const ChapterApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Mark chapter as read for the current user
         * @summary Mark Chapter read
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        chapterIdRead: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('chapterIdRead', 'id', id)
            const localVarPath = `/chapter/{id}/read`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Mark chapter as unread for the current user
         * @summary Mark Chapter unread
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        chapterIdUnread: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('chapterIdUnread', 'id', id)
            const localVarPath = `/chapter/{id}/read`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Delete Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteChapterId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteChapterId', 'id', id)
            const localVarPath = `/chapter/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapter: async (limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/chapter`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (title !== undefined) {
                localVarQueryParameter['title'] = title;
            }

            if (groups) {
                localVarQueryParameter['groups'] = groups;
            }

            if (uploader !== undefined) {
                localVarQueryParameter['uploader'] = uploader;
            }

            if (manga !== undefined) {
                localVarQueryParameter['manga'] = manga;
            }

            if (volume !== undefined) {
                localVarQueryParameter['volume'] = volume;
            }

            if (chapter !== undefined) {
                localVarQueryParameter['chapter'] = chapter;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapterId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getChapterId', 'id', id)
            const localVarPath = `/chapter/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed: async (limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/manga/feed`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Update Chapter
         * @param {string} id Chapter ID
         * @param {ChapterEdit} [chapterEdit] The size of the body is limited to 32KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putChapterId: async (id: string, chapterEdit?: ChapterEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('putChapterId', 'id', id)
            const localVarPath = `/chapter/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(chapterEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * ChapterApi - functional programming interface
 * @export
 */
export const ChapterApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = ChapterApiAxiosParamCreator(configuration)
    return {
        /**
         * Mark chapter as read for the current user
         * @summary Mark Chapter read
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async chapterIdRead(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2003>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.chapterIdRead(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Mark chapter as unread for the current user
         * @summary Mark Chapter unread
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async chapterIdUnread(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2003>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.chapterIdUnread(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Delete Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteChapterId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteChapterId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getChapter(limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getChapter(limit, offset, ids, title, groups, uploader, manga, volume, chapter, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getChapterId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getChapterId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Update Chapter
         * @param {string} id Chapter ID
         * @param {ChapterEdit} [chapterEdit] The size of the body is limited to 32KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async putChapterId(id: string, chapterEdit?: ChapterEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.putChapterId(id, chapterEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * ChapterApi - factory interface
 * @export
 */
export const ChapterApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = ChapterApiFp(configuration)
    return {
        /**
         * Mark chapter as read for the current user
         * @summary Mark Chapter read
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        chapterIdRead(id: string, options?: any): AxiosPromise<InlineResponse2003> {
            return localVarFp.chapterIdRead(id, options).then((request) => request(axios, basePath));
        },
        /**
         * Mark chapter as unread for the current user
         * @summary Mark Chapter unread
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        chapterIdUnread(id: string, options?: any): AxiosPromise<InlineResponse2003> {
            return localVarFp.chapterIdUnread(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Delete Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteChapterId(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteChapterId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapter(limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getChapter(limit, offset, ids, title, groups, uploader, manga, volume, chapter, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get Chapter
         * @param {string} id Chapter ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapterId(id: string, options?: any): AxiosPromise<ChapterResponse> {
            return localVarFp.getChapterId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Update Chapter
         * @param {string} id Chapter ID
         * @param {ChapterEdit} [chapterEdit] The size of the body is limited to 32KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putChapterId(id: string, chapterEdit?: ChapterEdit, options?: any): AxiosPromise<ChapterResponse> {
            return localVarFp.putChapterId(id, chapterEdit, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for chapterIdRead operation in ChapterApi.
 * @export
 * @interface ChapterApiChapterIdReadRequest
 */
export interface ChapterApiChapterIdReadRequest {
    /**
     * 
     * @type {string}
     * @memberof ChapterApiChapterIdRead
     */
    readonly id: string
}

/**
 * Request parameters for chapterIdUnread operation in ChapterApi.
 * @export
 * @interface ChapterApiChapterIdUnreadRequest
 */
export interface ChapterApiChapterIdUnreadRequest {
    /**
     * 
     * @type {string}
     * @memberof ChapterApiChapterIdUnread
     */
    readonly id: string
}

/**
 * Request parameters for deleteChapterId operation in ChapterApi.
 * @export
 * @interface ChapterApiDeleteChapterIdRequest
 */
export interface ChapterApiDeleteChapterIdRequest {
    /**
     * Chapter ID
     * @type {string}
     * @memberof ChapterApiDeleteChapterId
     */
    readonly id: string
}

/**
 * Request parameters for getChapter operation in ChapterApi.
 * @export
 * @interface ChapterApiGetChapterRequest
 */
export interface ChapterApiGetChapterRequest {
    /**
     * 
     * @type {number}
     * @memberof ChapterApiGetChapter
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof ChapterApiGetChapter
     */
    readonly offset?: number

    /**
     * Chapter ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof ChapterApiGetChapter
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly title?: string

    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterApiGetChapter
     */
    readonly groups?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly uploader?: string

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly manga?: string

    /**
     * 
     * @type {string | Array<string>}
     * @memberof ChapterApiGetChapter
     */
    readonly volume?: string | Array<string>

    /**
     * 
     * @type {string | Array<string>}
     * @memberof ChapterApiGetChapter
     */
    readonly chapter?: string | Array<string>

    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterApiGetChapter
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetChapter
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof ChapterApiGetChapter
     */
    readonly order?: object
}

/**
 * Request parameters for getChapterId operation in ChapterApi.
 * @export
 * @interface ChapterApiGetChapterIdRequest
 */
export interface ChapterApiGetChapterIdRequest {
    /**
     * Chapter ID
     * @type {string}
     * @memberof ChapterApiGetChapterId
     */
    readonly id: string
}

/**
 * Request parameters for getUserFollowsMangaFeed operation in ChapterApi.
 * @export
 * @interface ChapterApiGetUserFollowsMangaFeedRequest
 */
export interface ChapterApiGetUserFollowsMangaFeedRequest {
    /**
     * 
     * @type {number}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof ChapterApiGetUserFollowsMangaFeed
     */
    readonly order?: object
}

/**
 * Request parameters for putChapterId operation in ChapterApi.
 * @export
 * @interface ChapterApiPutChapterIdRequest
 */
export interface ChapterApiPutChapterIdRequest {
    /**
     * Chapter ID
     * @type {string}
     * @memberof ChapterApiPutChapterId
     */
    readonly id: string

    /**
     * The size of the body is limited to 32KB.
     * @type {ChapterEdit}
     * @memberof ChapterApiPutChapterId
     */
    readonly chapterEdit?: ChapterEdit
}

/**
 * ChapterApi - object-oriented interface
 * @export
 * @class ChapterApi
 * @extends {BaseAPI}
 */
export class ChapterApi extends BaseAPI {
    /**
     * Mark chapter as read for the current user
     * @summary Mark Chapter read
     * @param {ChapterApiChapterIdReadRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public chapterIdRead(requestParameters: ChapterApiChapterIdReadRequest, options?: any) {
        return ChapterApiFp(this.configuration).chapterIdRead(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Mark chapter as unread for the current user
     * @summary Mark Chapter unread
     * @param {ChapterApiChapterIdUnreadRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public chapterIdUnread(requestParameters: ChapterApiChapterIdUnreadRequest, options?: any) {
        return ChapterApiFp(this.configuration).chapterIdUnread(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Delete Chapter
     * @param {ChapterApiDeleteChapterIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public deleteChapterId(requestParameters: ChapterApiDeleteChapterIdRequest, options?: any) {
        return ChapterApiFp(this.configuration).deleteChapterId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
     * @summary Chapter list
     * @param {ChapterApiGetChapterRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public getChapter(requestParameters: ChapterApiGetChapterRequest = {}, options?: any) {
        return ChapterApiFp(this.configuration).getChapter(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.title, requestParameters.groups, requestParameters.uploader, requestParameters.manga, requestParameters.volume, requestParameters.chapter, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get Chapter
     * @param {ChapterApiGetChapterIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public getChapterId(requestParameters: ChapterApiGetChapterIdRequest, options?: any) {
        return ChapterApiFp(this.configuration).getChapterId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Manga feed (Chapter list)
     * @param {ChapterApiGetUserFollowsMangaFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public getUserFollowsMangaFeed(requestParameters: ChapterApiGetUserFollowsMangaFeedRequest = {}, options?: any) {
        return ChapterApiFp(this.configuration).getUserFollowsMangaFeed(requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Update Chapter
     * @param {ChapterApiPutChapterIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ChapterApi
     */
    public putChapterId(requestParameters: ChapterApiPutChapterIdRequest, options?: any) {
        return ChapterApiFp(this.configuration).putChapterId(requestParameters.id, requestParameters.chapterEdit, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * CoverApi - axios parameter creator
 * @export
 */
export const CoverApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Delete Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteCover: async (coverId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'coverId' is not null or undefined
            assertParamExists('deleteCover', 'coverId', coverId)
            const localVarPath = `/cover/{coverId}`
                .replace(`{${"coverId"}}`, encodeURIComponent(String(coverId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Edit Cover
         * @param {string} coverId 
         * @param {CoverEdit} [coverEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        editCover: async (coverId: string, coverEdit?: CoverEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'coverId' is not null or undefined
            assertParamExists('editCover', 'coverId', coverId)
            const localVarPath = `/cover/{coverId}`
                .replace(`{${"coverId"}}`, encodeURIComponent(String(coverId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(coverEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCover: async (limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/cover`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (manga) {
                localVarQueryParameter['manga'] = manga;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (uploaders) {
                localVarQueryParameter['uploaders'] = uploaders;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCoverId: async (coverId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'coverId' is not null or undefined
            assertParamExists('getCoverId', 'coverId', coverId)
            const localVarPath = `/cover/{coverId}`
                .replace(`{${"coverId"}}`, encodeURIComponent(String(coverId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        uploadCover: async (mangaId: string, file?: any, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'mangaId' is not null or undefined
            assertParamExists('uploadCover', 'mangaId', mangaId)
            const localVarPath = `/cover/{mangaId}`
                .replace(`{${"mangaId"}}`, encodeURIComponent(String(mangaId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;
            const localVarFormParams = new ((configuration && configuration.formDataCtor) || FormData)();

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


            if (file !== undefined) { 
                localVarFormParams.append('file', file as any);
            }
    
    
            localVarHeaderParameter['Content-Type'] = 'multipart/form-data';
    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = localVarFormParams;

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * CoverApi - functional programming interface
 * @export
 */
export const CoverApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = CoverApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Delete Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteCover(coverId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteCover(coverId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Edit Cover
         * @param {string} coverId 
         * @param {CoverEdit} [coverEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async editCover(coverId: string, coverEdit?: CoverEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.editCover(coverId, coverEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getCover(limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getCover(limit, offset, manga, ids, uploaders, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getCoverId(coverId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getCoverId(coverId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async uploadCover(mangaId: string, file?: any, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.uploadCover(mangaId, file, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * CoverApi - factory interface
 * @export
 */
export const CoverApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = CoverApiFp(configuration)
    return {
        /**
         * 
         * @summary Delete Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteCover(coverId: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteCover(coverId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Edit Cover
         * @param {string} coverId 
         * @param {CoverEdit} [coverEdit] The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        editCover(coverId: string, coverEdit?: CoverEdit, options?: any): AxiosPromise<CoverResponse> {
            return localVarFp.editCover(coverId, coverEdit, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCover(limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options?: any): AxiosPromise<CoverList> {
            return localVarFp.getCover(limit, offset, manga, ids, uploaders, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get Cover
         * @param {string} coverId 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCoverId(coverId: string, options?: any): AxiosPromise<CoverResponse> {
            return localVarFp.getCoverId(coverId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        uploadCover(mangaId: string, file?: any, options?: any): AxiosPromise<CoverResponse> {
            return localVarFp.uploadCover(mangaId, file, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for deleteCover operation in CoverApi.
 * @export
 * @interface CoverApiDeleteCoverRequest
 */
export interface CoverApiDeleteCoverRequest {
    /**
     * 
     * @type {string}
     * @memberof CoverApiDeleteCover
     */
    readonly coverId: string
}

/**
 * Request parameters for editCover operation in CoverApi.
 * @export
 * @interface CoverApiEditCoverRequest
 */
export interface CoverApiEditCoverRequest {
    /**
     * 
     * @type {string}
     * @memberof CoverApiEditCover
     */
    readonly coverId: string

    /**
     * The size of the body is limited to 2KB.
     * @type {CoverEdit}
     * @memberof CoverApiEditCover
     */
    readonly coverEdit?: CoverEdit
}

/**
 * Request parameters for getCover operation in CoverApi.
 * @export
 * @interface CoverApiGetCoverRequest
 */
export interface CoverApiGetCoverRequest {
    /**
     * 
     * @type {number}
     * @memberof CoverApiGetCover
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof CoverApiGetCover
     */
    readonly offset?: number

    /**
     * Manga ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof CoverApiGetCover
     */
    readonly manga?: Array<string>

    /**
     * Covers ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof CoverApiGetCover
     */
    readonly ids?: Array<string>

    /**
     * User ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof CoverApiGetCover
     */
    readonly uploaders?: Array<string>

    /**
     * 
     * @type {object}
     * @memberof CoverApiGetCover
     */
    readonly order?: object
}

/**
 * Request parameters for getCoverId operation in CoverApi.
 * @export
 * @interface CoverApiGetCoverIdRequest
 */
export interface CoverApiGetCoverIdRequest {
    /**
     * 
     * @type {string}
     * @memberof CoverApiGetCoverId
     */
    readonly coverId: string
}

/**
 * Request parameters for uploadCover operation in CoverApi.
 * @export
 * @interface CoverApiUploadCoverRequest
 */
export interface CoverApiUploadCoverRequest {
    /**
     * 
     * @type {string}
     * @memberof CoverApiUploadCover
     */
    readonly mangaId: string

    /**
     * 
     * @type {any}
     * @memberof CoverApiUploadCover
     */
    readonly file?: any
}

/**
 * CoverApi - object-oriented interface
 * @export
 * @class CoverApi
 * @extends {BaseAPI}
 */
export class CoverApi extends BaseAPI {
    /**
     * 
     * @summary Delete Cover
     * @param {CoverApiDeleteCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoverApi
     */
    public deleteCover(requestParameters: CoverApiDeleteCoverRequest, options?: any) {
        return CoverApiFp(this.configuration).deleteCover(requestParameters.coverId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Edit Cover
     * @param {CoverApiEditCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoverApi
     */
    public editCover(requestParameters: CoverApiEditCoverRequest, options?: any) {
        return CoverApiFp(this.configuration).editCover(requestParameters.coverId, requestParameters.coverEdit, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary CoverArt list
     * @param {CoverApiGetCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoverApi
     */
    public getCover(requestParameters: CoverApiGetCoverRequest = {}, options?: any) {
        return CoverApiFp(this.configuration).getCover(requestParameters.limit, requestParameters.offset, requestParameters.manga, requestParameters.ids, requestParameters.uploaders, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get Cover
     * @param {CoverApiGetCoverIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoverApi
     */
    public getCoverId(requestParameters: CoverApiGetCoverIdRequest, options?: any) {
        return CoverApiFp(this.configuration).getCoverId(requestParameters.coverId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Upload Cover
     * @param {CoverApiUploadCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CoverApi
     */
    public uploadCover(requestParameters: CoverApiUploadCoverRequest, options?: any) {
        return CoverApiFp(this.configuration).uploadCover(requestParameters.mangaId, requestParameters.file, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * CustomListApi - axios parameter creator
 * @export
 */
export const CustomListApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Delete CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteListId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteListId', 'id', id)
            const localVarPath = `/list/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdListListId: async (id: string, listId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteMangaIdListListId', 'id', id)
            // verify required parameter 'listId' is not null or undefined
            assertParamExists('deleteMangaIdListListId', 'listId', listId)
            const localVarPath = `/manga/{id}/list/{listId}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)))
                .replace(`{${"listId"}}`, encodeURIComponent(String(listId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getListId', 'id', id)
            const localVarPath = `/list/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListIdFeed: async (id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getListIdFeed', 'id', id)
            const localVarPath = `/list/{id}/feed`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * This will list only public CustomList
         * @summary Get User\'s CustomList list
         * @param {string} id User ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserIdList: async (id: string, limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getUserIdList', 'id', id)
            const localVarPath = `/user/{id}/list`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * This will list public and private CustomList
         * @summary Get logged User CustomList list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserList: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/list`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Create CustomList
         * @param {CustomListCreate} [customListCreate] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postList: async (customListCreate?: CustomListCreate, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/list`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(customListCreate, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdListListId: async (id: string, listId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('postMangaIdListListId', 'id', id)
            // verify required parameter 'listId' is not null or undefined
            assertParamExists('postMangaIdListListId', 'listId', listId)
            const localVarPath = `/manga/{id}/list/{listId}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)))
                .replace(`{${"listId"}}`, encodeURIComponent(String(listId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * The size of the body is limited to 8KB.
         * @summary Update CustomList
         * @param {string} id CustomList ID
         * @param {CustomListEdit} [customListEdit] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putListId: async (id: string, customListEdit?: CustomListEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('putListId', 'id', id)
            const localVarPath = `/list/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(customListEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * CustomListApi - functional programming interface
 * @export
 */
export const CustomListApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = CustomListApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Delete CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteListId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteListId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteMangaIdListListId(id: string, listId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteMangaIdListListId(id, listId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getListId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CustomListResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getListId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getListIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getListIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * This will list only public CustomList
         * @summary Get User\'s CustomList list
         * @param {string} id User ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserIdList(id: string, limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CustomListList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserIdList(id, limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * This will list public and private CustomList
         * @summary Get logged User CustomList list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserList(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CustomListList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserList(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Create CustomList
         * @param {CustomListCreate} [customListCreate] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postList(customListCreate?: CustomListCreate, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CustomListResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postList(customListCreate, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postMangaIdListListId(id: string, listId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postMangaIdListListId(id, listId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * The size of the body is limited to 8KB.
         * @summary Update CustomList
         * @param {string} id CustomList ID
         * @param {CustomListEdit} [customListEdit] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async putListId(id: string, customListEdit?: CustomListEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CustomListResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.putListId(id, customListEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * CustomListApi - factory interface
 * @export
 */
export const CustomListApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = CustomListApiFp(configuration)
    return {
        /**
         * 
         * @summary Delete CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteListId(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteListId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdListListId(id: string, listId: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteMangaIdListListId(id, listId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get CustomList
         * @param {string} id CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListId(id: string, options?: any): AxiosPromise<CustomListResponse> {
            return localVarFp.getListId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getListIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * This will list only public CustomList
         * @summary Get User\'s CustomList list
         * @param {string} id User ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserIdList(id: string, limit?: number, offset?: number, options?: any): AxiosPromise<CustomListList> {
            return localVarFp.getUserIdList(id, limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * This will list public and private CustomList
         * @summary Get logged User CustomList list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserList(limit?: number, offset?: number, options?: any): AxiosPromise<CustomListList> {
            return localVarFp.getUserList(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Create CustomList
         * @param {CustomListCreate} [customListCreate] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postList(customListCreate?: CustomListCreate, options?: any): AxiosPromise<CustomListResponse> {
            return localVarFp.postList(customListCreate, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdListListId(id: string, listId: string, options?: any): AxiosPromise<Response> {
            return localVarFp.postMangaIdListListId(id, listId, options).then((request) => request(axios, basePath));
        },
        /**
         * The size of the body is limited to 8KB.
         * @summary Update CustomList
         * @param {string} id CustomList ID
         * @param {CustomListEdit} [customListEdit] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putListId(id: string, customListEdit?: CustomListEdit, options?: any): AxiosPromise<CustomListResponse> {
            return localVarFp.putListId(id, customListEdit, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for deleteListId operation in CustomListApi.
 * @export
 * @interface CustomListApiDeleteListIdRequest
 */
export interface CustomListApiDeleteListIdRequest {
    /**
     * CustomList ID
     * @type {string}
     * @memberof CustomListApiDeleteListId
     */
    readonly id: string
}

/**
 * Request parameters for deleteMangaIdListListId operation in CustomListApi.
 * @export
 * @interface CustomListApiDeleteMangaIdListListIdRequest
 */
export interface CustomListApiDeleteMangaIdListListIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof CustomListApiDeleteMangaIdListListId
     */
    readonly id: string

    /**
     * CustomList ID
     * @type {string}
     * @memberof CustomListApiDeleteMangaIdListListId
     */
    readonly listId: string
}

/**
 * Request parameters for getListId operation in CustomListApi.
 * @export
 * @interface CustomListApiGetListIdRequest
 */
export interface CustomListApiGetListIdRequest {
    /**
     * CustomList ID
     * @type {string}
     * @memberof CustomListApiGetListId
     */
    readonly id: string
}

/**
 * Request parameters for getListIdFeed operation in CustomListApi.
 * @export
 * @interface CustomListApiGetListIdFeedRequest
 */
export interface CustomListApiGetListIdFeedRequest {
    /**
     * 
     * @type {string}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly id: string

    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof CustomListApiGetListIdFeed
     */
    readonly order?: object
}

/**
 * Request parameters for getUserIdList operation in CustomListApi.
 * @export
 * @interface CustomListApiGetUserIdListRequest
 */
export interface CustomListApiGetUserIdListRequest {
    /**
     * User ID
     * @type {string}
     * @memberof CustomListApiGetUserIdList
     */
    readonly id: string

    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetUserIdList
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetUserIdList
     */
    readonly offset?: number
}

/**
 * Request parameters for getUserList operation in CustomListApi.
 * @export
 * @interface CustomListApiGetUserListRequest
 */
export interface CustomListApiGetUserListRequest {
    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetUserList
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof CustomListApiGetUserList
     */
    readonly offset?: number
}

/**
 * Request parameters for postList operation in CustomListApi.
 * @export
 * @interface CustomListApiPostListRequest
 */
export interface CustomListApiPostListRequest {
    /**
     * The size of the body is limited to 8KB.
     * @type {CustomListCreate}
     * @memberof CustomListApiPostList
     */
    readonly customListCreate?: CustomListCreate
}

/**
 * Request parameters for postMangaIdListListId operation in CustomListApi.
 * @export
 * @interface CustomListApiPostMangaIdListListIdRequest
 */
export interface CustomListApiPostMangaIdListListIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof CustomListApiPostMangaIdListListId
     */
    readonly id: string

    /**
     * CustomList ID
     * @type {string}
     * @memberof CustomListApiPostMangaIdListListId
     */
    readonly listId: string
}

/**
 * Request parameters for putListId operation in CustomListApi.
 * @export
 * @interface CustomListApiPutListIdRequest
 */
export interface CustomListApiPutListIdRequest {
    /**
     * CustomList ID
     * @type {string}
     * @memberof CustomListApiPutListId
     */
    readonly id: string

    /**
     * 
     * @type {CustomListEdit}
     * @memberof CustomListApiPutListId
     */
    readonly customListEdit?: CustomListEdit
}

/**
 * CustomListApi - object-oriented interface
 * @export
 * @class CustomListApi
 * @extends {BaseAPI}
 */
export class CustomListApi extends BaseAPI {
    /**
     * 
     * @summary Delete CustomList
     * @param {CustomListApiDeleteListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public deleteListId(requestParameters: CustomListApiDeleteListIdRequest, options?: any) {
        return CustomListApiFp(this.configuration).deleteListId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Remove Manga in CustomList
     * @param {CustomListApiDeleteMangaIdListListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public deleteMangaIdListListId(requestParameters: CustomListApiDeleteMangaIdListListIdRequest, options?: any) {
        return CustomListApiFp(this.configuration).deleteMangaIdListListId(requestParameters.id, requestParameters.listId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get CustomList
     * @param {CustomListApiGetListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public getListId(requestParameters: CustomListApiGetListIdRequest, options?: any) {
        return CustomListApiFp(this.configuration).getListId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary CustomList Manga feed
     * @param {CustomListApiGetListIdFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public getListIdFeed(requestParameters: CustomListApiGetListIdFeedRequest, options?: any) {
        return CustomListApiFp(this.configuration).getListIdFeed(requestParameters.id, requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * This will list only public CustomList
     * @summary Get User\'s CustomList list
     * @param {CustomListApiGetUserIdListRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public getUserIdList(requestParameters: CustomListApiGetUserIdListRequest, options?: any) {
        return CustomListApiFp(this.configuration).getUserIdList(requestParameters.id, requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * This will list public and private CustomList
     * @summary Get logged User CustomList list
     * @param {CustomListApiGetUserListRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public getUserList(requestParameters: CustomListApiGetUserListRequest = {}, options?: any) {
        return CustomListApiFp(this.configuration).getUserList(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Create CustomList
     * @param {CustomListApiPostListRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public postList(requestParameters: CustomListApiPostListRequest = {}, options?: any) {
        return CustomListApiFp(this.configuration).postList(requestParameters.customListCreate, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Add Manga in CustomList
     * @param {CustomListApiPostMangaIdListListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public postMangaIdListListId(requestParameters: CustomListApiPostMangaIdListListIdRequest, options?: any) {
        return CustomListApiFp(this.configuration).postMangaIdListListId(requestParameters.id, requestParameters.listId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * The size of the body is limited to 8KB.
     * @summary Update CustomList
     * @param {CustomListApiPutListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CustomListApi
     */
    public putListId(requestParameters: CustomListApiPutListIdRequest, options?: any) {
        return CustomListApiFp(this.configuration).putListId(requestParameters.id, requestParameters.customListEdit, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * FeedApi - axios parameter creator
 * @export
 */
export const FeedApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListIdFeed: async (id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getListIdFeed', 'id', id)
            const localVarPath = `/list/{id}/feed`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed: async (limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/manga/feed`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * FeedApi - functional programming interface
 * @export
 */
export const FeedApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = FeedApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getListIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getListIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * FeedApi - factory interface
 * @export
 */
export const FeedApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = FeedApiFp(configuration)
    return {
        /**
         * 
         * @summary CustomList Manga feed
         * @param {string} id 
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getListIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getListIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for getListIdFeed operation in FeedApi.
 * @export
 * @interface FeedApiGetListIdFeedRequest
 */
export interface FeedApiGetListIdFeedRequest {
    /**
     * 
     * @type {string}
     * @memberof FeedApiGetListIdFeed
     */
    readonly id: string

    /**
     * 
     * @type {number}
     * @memberof FeedApiGetListIdFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof FeedApiGetListIdFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof FeedApiGetListIdFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetListIdFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetListIdFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetListIdFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof FeedApiGetListIdFeed
     */
    readonly order?: object
}

/**
 * Request parameters for getUserFollowsMangaFeed operation in FeedApi.
 * @export
 * @interface FeedApiGetUserFollowsMangaFeedRequest
 */
export interface FeedApiGetUserFollowsMangaFeedRequest {
    /**
     * 
     * @type {number}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof FeedApiGetUserFollowsMangaFeed
     */
    readonly order?: object
}

/**
 * FeedApi - object-oriented interface
 * @export
 * @class FeedApi
 * @extends {BaseAPI}
 */
export class FeedApi extends BaseAPI {
    /**
     * 
     * @summary CustomList Manga feed
     * @param {FeedApiGetListIdFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FeedApi
     */
    public getListIdFeed(requestParameters: FeedApiGetListIdFeedRequest, options?: any) {
        return FeedApiFp(this.configuration).getListIdFeed(requestParameters.id, requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Manga feed (Chapter list)
     * @param {FeedApiGetUserFollowsMangaFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FeedApi
     */
    public getUserFollowsMangaFeed(requestParameters: FeedApiGetUserFollowsMangaFeedRequest = {}, options?: any) {
        return FeedApiFp(this.configuration).getUserFollowsMangaFeed(requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * InfrastructureApi - axios parameter creator
 * @export
 */
export const InfrastructureApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Ping the server
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pingGet: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/ping`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * InfrastructureApi - functional programming interface
 * @export
 */
export const InfrastructureApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = InfrastructureApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Ping the server
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async pingGet(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<string>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.pingGet(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * InfrastructureApi - factory interface
 * @export
 */
export const InfrastructureApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = InfrastructureApiFp(configuration)
    return {
        /**
         * 
         * @summary Ping the server
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        pingGet(options?: any): AxiosPromise<string> {
            return localVarFp.pingGet(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * InfrastructureApi - object-oriented interface
 * @export
 * @class InfrastructureApi
 * @extends {BaseAPI}
 */
export class InfrastructureApi extends BaseAPI {
    /**
     * 
     * @summary Ping the server
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof InfrastructureApi
     */
    public pingGet(options?: any) {
        return InfrastructureApiFp(this.configuration).pingGet(options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * LegacyApi - axios parameter creator
 * @export
 */
export const LegacyApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Legacy ID mapping
         * @param {MappingIdBody} [mappingIdBody] The size of the body is limited to 10KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postLegacyMapping: async (mappingIdBody?: MappingIdBody, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/legacy/mapping`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(mappingIdBody, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * LegacyApi - functional programming interface
 * @export
 */
export const LegacyApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = LegacyApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Legacy ID mapping
         * @param {MappingIdBody} [mappingIdBody] The size of the body is limited to 10KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postLegacyMapping(mappingIdBody?: MappingIdBody, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<MappingIdResponse>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postLegacyMapping(mappingIdBody, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * LegacyApi - factory interface
 * @export
 */
export const LegacyApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = LegacyApiFp(configuration)
    return {
        /**
         * 
         * @summary Legacy ID mapping
         * @param {MappingIdBody} [mappingIdBody] The size of the body is limited to 10KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postLegacyMapping(mappingIdBody?: MappingIdBody, options?: any): AxiosPromise<Array<MappingIdResponse>> {
            return localVarFp.postLegacyMapping(mappingIdBody, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for postLegacyMapping operation in LegacyApi.
 * @export
 * @interface LegacyApiPostLegacyMappingRequest
 */
export interface LegacyApiPostLegacyMappingRequest {
    /**
     * The size of the body is limited to 10KB.
     * @type {MappingIdBody}
     * @memberof LegacyApiPostLegacyMapping
     */
    readonly mappingIdBody?: MappingIdBody
}

/**
 * LegacyApi - object-oriented interface
 * @export
 * @class LegacyApi
 * @extends {BaseAPI}
 */
export class LegacyApi extends BaseAPI {
    /**
     * 
     * @summary Legacy ID mapping
     * @param {LegacyApiPostLegacyMappingRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof LegacyApi
     */
    public postLegacyMapping(requestParameters: LegacyApiPostLegacyMappingRequest = {}, options?: any) {
        return LegacyApiFp(this.configuration).postLegacyMapping(requestParameters.mappingIdBody, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * MangaApi - axios parameter creator
 * @export
 */
export const MangaApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Delete Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteMangaId', 'id', id)
            const localVarPath = `/manga/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Unfollow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdFollow: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteMangaIdFollow', 'id', id)
            const localVarPath = `/manga/{id}/follow`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdListListId: async (id: string, listId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteMangaIdListListId', 'id', id)
            // verify required parameter 'listId' is not null or undefined
            assertParamExists('deleteMangaIdListListId', 'listId', listId)
            const localVarPath = `/manga/{id}/list/{listId}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)))
                .replace(`{${"listId"}}`, encodeURIComponent(String(listId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * A list of chapter ids that are marked as read for the specified manga
         * @summary Manga read markers
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaChapterReadmarkers: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getMangaChapterReadmarkers', 'id', id)
            const localVarPath = `/manga/{id}/read`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * A list of chapter ids that are marked as read for the given manga ids
         * @summary Manga read markers
         * @param {Array<string>} ids Manga ids
         * @param {boolean} [grouped] Group results by manga ids
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaChapterReadmarkers2: async (ids: Array<string>, grouped?: boolean, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'ids' is not null or undefined
            assertParamExists('getMangaChapterReadmarkers2', 'ids', ids)
            const localVarPath = `/manga/read`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (grouped !== undefined) {
                localVarQueryParameter['grouped'] = grouped;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * View Manga.
         * @summary View Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getMangaId', 'id', id)
            const localVarPath = `/manga/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Manga feed
         * @param {string} id Manga ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaIdFeed: async (id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getMangaIdFeed', 'id', id)
            const localVarPath = `/manga/{id}/feed`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get a Manga reading status
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaIdStatus: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getMangaIdStatus', 'id', id)
            const localVarPath = `/manga/{id}/status`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get a random Manga
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaRandom: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga/random`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get all Manga reading status for logged User
         * @param {'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed'} [status] Used to filter the list by given status
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaStatus: async (status?: 'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed', options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga/status`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (status !== undefined) {
                localVarQueryParameter['status'] = status;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Tag list
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaTag: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga/tag`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchManga: async (limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (title !== undefined) {
                localVarQueryParameter['title'] = title;
            }

            if (authors) {
                localVarQueryParameter['authors'] = authors;
            }

            if (artists) {
                localVarQueryParameter['artists'] = artists;
            }

            if (year !== undefined) {
                localVarQueryParameter['year'] = year;
            }

            if (includedTags) {
                localVarQueryParameter['includedTags'] = includedTags;
            }

            if (includedTagsMode !== undefined) {
                localVarQueryParameter['includedTagsMode'] = includedTagsMode;
            }

            if (excludedTags) {
                localVarQueryParameter['excludedTags'] = excludedTags;
            }

            if (excludedTagsMode !== undefined) {
                localVarQueryParameter['excludedTagsMode'] = excludedTagsMode;
            }

            if (status) {
                localVarQueryParameter['status'] = status;
            }

            if (originalLanguage) {
                localVarQueryParameter['originalLanguage'] = originalLanguage;
            }

            if (publicationDemographic) {
                localVarQueryParameter['publicationDemographic'] = publicationDemographic;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (contentRating) {
                localVarQueryParameter['contentRating'] = contentRating;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsManga: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/manga`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed: async (limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/manga/feed`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get Manga volumes & chapters
         * @param {string} id Manga ID
         * @param {Array<string>} [translatedLanguage] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        mangaIdAggregateGet: async (id: string, translatedLanguage?: Array<string>, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('mangaIdAggregateGet', 'id', id)
            const localVarPath = `/manga/{id}/aggregate`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Create a new Manga.
         * @summary Create Manga
         * @param {MangaCreate} [mangaCreate] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postManga: async (mangaCreate?: MangaCreate, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(mangaCreate, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Follow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdFollow: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('postMangaIdFollow', 'id', id)
            const localVarPath = `/manga/{id}/follow`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdListListId: async (id: string, listId: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('postMangaIdListListId', 'id', id)
            // verify required parameter 'listId' is not null or undefined
            assertParamExists('postMangaIdListListId', 'listId', listId)
            const localVarPath = `/manga/{id}/list/{listId}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)))
                .replace(`{${"listId"}}`, encodeURIComponent(String(listId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Update Manga reading status
         * @param {string} id 
         * @param {UpdateMangaStatus} [updateMangaStatus] Using a &#x60;null&#x60; value in &#x60;status&#x60; field will remove the Manga reading status. The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdStatus: async (id: string, updateMangaStatus?: UpdateMangaStatus, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('postMangaIdStatus', 'id', id)
            const localVarPath = `/manga/{id}/status`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(updateMangaStatus, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Update Manga
         * @param {string} id Manga ID
         * @param {MangaEdit} [mangaEdit] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putMangaId: async (id: string, mangaEdit?: MangaEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('putMangaId', 'id', id)
            const localVarPath = `/manga/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(mangaEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * MangaApi - functional programming interface
 * @export
 */
export const MangaApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = MangaApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Delete Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteMangaId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteMangaId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Unfollow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteMangaIdFollow(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteMangaIdFollow(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteMangaIdListListId(id: string, listId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteMangaIdListListId(id, listId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * A list of chapter ids that are marked as read for the specified manga
         * @summary Manga read markers
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaChapterReadmarkers(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2001>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaChapterReadmarkers(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * A list of chapter ids that are marked as read for the given manga ids
         * @summary Manga read markers
         * @param {Array<string>} ids Manga ids
         * @param {boolean} [grouped] Group results by manga ids
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaChapterReadmarkers2(ids: Array<string>, grouped?: boolean, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2002>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaChapterReadmarkers2(ids, grouped, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * View Manga.
         * @summary View Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Manga feed
         * @param {string} id Manga ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get a Manga reading status
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaIdStatus(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2006>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaIdStatus(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get a random Manga
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaRandom(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaRandom(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get all Manga reading status for logged User
         * @param {'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed'} [status] Used to filter the list by given status
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaStatus(status?: 'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed', options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse2005>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaStatus(status, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Tag list
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getMangaTag(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Array<TagResponse>>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getMangaTag(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSearchManga(limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSearchManga(limit, offset, title, authors, artists, year, includedTags, includedTagsMode, excludedTags, excludedTagsMode, status, originalLanguage, publicationDemographic, ids, contentRating, createdAtSince, updatedAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsManga(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsManga(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get Manga volumes & chapters
         * @param {string} id Manga ID
         * @param {Array<string>} [translatedLanguage] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async mangaIdAggregateGet(id: string, translatedLanguage?: Array<string>, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<InlineResponse200>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.mangaIdAggregateGet(id, translatedLanguage, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Create a new Manga.
         * @summary Create Manga
         * @param {MangaCreate} [mangaCreate] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postManga(mangaCreate?: MangaCreate, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postManga(mangaCreate, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Follow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postMangaIdFollow(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postMangaIdFollow(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postMangaIdListListId(id: string, listId: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postMangaIdListListId(id, listId, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Update Manga reading status
         * @param {string} id 
         * @param {UpdateMangaStatus} [updateMangaStatus] Using a &#x60;null&#x60; value in &#x60;status&#x60; field will remove the Manga reading status. The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postMangaIdStatus(id: string, updateMangaStatus?: UpdateMangaStatus, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postMangaIdStatus(id, updateMangaStatus, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Update Manga
         * @param {string} id Manga ID
         * @param {MangaEdit} [mangaEdit] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async putMangaId(id: string, mangaEdit?: MangaEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.putMangaId(id, mangaEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * MangaApi - factory interface
 * @export
 */
export const MangaApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = MangaApiFp(configuration)
    return {
        /**
         * 
         * @summary Delete Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaId(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteMangaId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Unfollow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdFollow(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteMangaIdFollow(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Remove Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteMangaIdListListId(id: string, listId: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteMangaIdListListId(id, listId, options).then((request) => request(axios, basePath));
        },
        /**
         * A list of chapter ids that are marked as read for the specified manga
         * @summary Manga read markers
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaChapterReadmarkers(id: string, options?: any): AxiosPromise<InlineResponse2001> {
            return localVarFp.getMangaChapterReadmarkers(id, options).then((request) => request(axios, basePath));
        },
        /**
         * A list of chapter ids that are marked as read for the given manga ids
         * @summary Manga read markers
         * @param {Array<string>} ids Manga ids
         * @param {boolean} [grouped] Group results by manga ids
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaChapterReadmarkers2(ids: Array<string>, grouped?: boolean, options?: any): AxiosPromise<InlineResponse2002> {
            return localVarFp.getMangaChapterReadmarkers2(ids, grouped, options).then((request) => request(axios, basePath));
        },
        /**
         * View Manga.
         * @summary View Manga
         * @param {string} id Manga ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaId(id: string, options?: any): AxiosPromise<MangaResponse> {
            return localVarFp.getMangaId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Manga feed
         * @param {string} id Manga ID
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaIdFeed(id: string, limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getMangaIdFeed(id, limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get a Manga reading status
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaIdStatus(id: string, options?: any): AxiosPromise<InlineResponse2006> {
            return localVarFp.getMangaIdStatus(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get a random Manga
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaRandom(options?: any): AxiosPromise<MangaResponse> {
            return localVarFp.getMangaRandom(options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get all Manga reading status for logged User
         * @param {'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed'} [status] Used to filter the list by given status
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaStatus(status?: 'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed', options?: any): AxiosPromise<InlineResponse2005> {
            return localVarFp.getMangaStatus(status, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Tag list
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getMangaTag(options?: any): AxiosPromise<Array<TagResponse>> {
            return localVarFp.getMangaTag(options).then((request) => request(axios, basePath));
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchManga(limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options?: any): AxiosPromise<MangaList> {
            return localVarFp.getSearchManga(limit, offset, title, authors, artists, year, includedTags, includedTagsMode, excludedTags, excludedTagsMode, status, originalLanguage, publicationDemographic, ids, contentRating, createdAtSince, updatedAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsManga(limit?: number, offset?: number, options?: any): AxiosPromise<MangaList> {
            return localVarFp.getUserFollowsManga(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Manga feed (Chapter list)
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsMangaFeed(limit?: number, offset?: number, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getUserFollowsMangaFeed(limit, offset, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get Manga volumes & chapters
         * @param {string} id Manga ID
         * @param {Array<string>} [translatedLanguage] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        mangaIdAggregateGet(id: string, translatedLanguage?: Array<string>, options?: any): AxiosPromise<InlineResponse200> {
            return localVarFp.mangaIdAggregateGet(id, translatedLanguage, options).then((request) => request(axios, basePath));
        },
        /**
         * Create a new Manga.
         * @summary Create Manga
         * @param {MangaCreate} [mangaCreate] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postManga(mangaCreate?: MangaCreate, options?: any): AxiosPromise<MangaResponse> {
            return localVarFp.postManga(mangaCreate, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Follow Manga
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdFollow(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.postMangaIdFollow(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Add Manga in CustomList
         * @param {string} id Manga ID
         * @param {string} listId CustomList ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdListListId(id: string, listId: string, options?: any): AxiosPromise<Response> {
            return localVarFp.postMangaIdListListId(id, listId, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Update Manga reading status
         * @param {string} id 
         * @param {UpdateMangaStatus} [updateMangaStatus] Using a &#x60;null&#x60; value in &#x60;status&#x60; field will remove the Manga reading status. The size of the body is limited to 2KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postMangaIdStatus(id: string, updateMangaStatus?: UpdateMangaStatus, options?: any): AxiosPromise<Response> {
            return localVarFp.postMangaIdStatus(id, updateMangaStatus, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Update Manga
         * @param {string} id Manga ID
         * @param {MangaEdit} [mangaEdit] The size of the body is limited to 16KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putMangaId(id: string, mangaEdit?: MangaEdit, options?: any): AxiosPromise<MangaResponse> {
            return localVarFp.putMangaId(id, mangaEdit, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for deleteMangaId operation in MangaApi.
 * @export
 * @interface MangaApiDeleteMangaIdRequest
 */
export interface MangaApiDeleteMangaIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiDeleteMangaId
     */
    readonly id: string
}

/**
 * Request parameters for deleteMangaIdFollow operation in MangaApi.
 * @export
 * @interface MangaApiDeleteMangaIdFollowRequest
 */
export interface MangaApiDeleteMangaIdFollowRequest {
    /**
     * 
     * @type {string}
     * @memberof MangaApiDeleteMangaIdFollow
     */
    readonly id: string
}

/**
 * Request parameters for deleteMangaIdListListId operation in MangaApi.
 * @export
 * @interface MangaApiDeleteMangaIdListListIdRequest
 */
export interface MangaApiDeleteMangaIdListListIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiDeleteMangaIdListListId
     */
    readonly id: string

    /**
     * CustomList ID
     * @type {string}
     * @memberof MangaApiDeleteMangaIdListListId
     */
    readonly listId: string
}

/**
 * Request parameters for getMangaChapterReadmarkers operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaChapterReadmarkersRequest
 */
export interface MangaApiGetMangaChapterReadmarkersRequest {
    /**
     * 
     * @type {string}
     * @memberof MangaApiGetMangaChapterReadmarkers
     */
    readonly id: string
}

/**
 * Request parameters for getMangaChapterReadmarkers2 operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaChapterReadmarkers2Request
 */
export interface MangaApiGetMangaChapterReadmarkers2Request {
    /**
     * Manga ids
     * @type {Array<string>}
     * @memberof MangaApiGetMangaChapterReadmarkers2
     */
    readonly ids: Array<string>

    /**
     * Group results by manga ids
     * @type {boolean}
     * @memberof MangaApiGetMangaChapterReadmarkers2
     */
    readonly grouped?: boolean
}

/**
 * Request parameters for getMangaId operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaIdRequest
 */
export interface MangaApiGetMangaIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiGetMangaId
     */
    readonly id: string
}

/**
 * Request parameters for getMangaIdFeed operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaIdFeedRequest
 */
export interface MangaApiGetMangaIdFeedRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly id: string

    /**
     * 
     * @type {number}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof MangaApiGetMangaIdFeed
     */
    readonly order?: object
}

/**
 * Request parameters for getMangaIdStatus operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaIdStatusRequest
 */
export interface MangaApiGetMangaIdStatusRequest {
    /**
     * 
     * @type {string}
     * @memberof MangaApiGetMangaIdStatus
     */
    readonly id: string
}

/**
 * Request parameters for getMangaStatus operation in MangaApi.
 * @export
 * @interface MangaApiGetMangaStatusRequest
 */
export interface MangaApiGetMangaStatusRequest {
    /**
     * Used to filter the list by given status
     * @type {'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed'}
     * @memberof MangaApiGetMangaStatus
     */
    readonly status?: 'reading' | 'on_hold' | 'plan_to_read' | 'dropped' | 're_reading' | 'completed'
}

/**
 * Request parameters for getSearchManga operation in MangaApi.
 * @export
 * @interface MangaApiGetSearchMangaRequest
 */
export interface MangaApiGetSearchMangaRequest {
    /**
     * 
     * @type {number}
     * @memberof MangaApiGetSearchManga
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof MangaApiGetSearchManga
     */
    readonly offset?: number

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetSearchManga
     */
    readonly title?: string

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly authors?: Array<string>

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly artists?: Array<string>

    /**
     * Year of release
     * @type {number}
     * @memberof MangaApiGetSearchManga
     */
    readonly year?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly includedTags?: Array<string>

    /**
     * 
     * @type {'AND' | 'OR'}
     * @memberof MangaApiGetSearchManga
     */
    readonly includedTagsMode?: 'AND' | 'OR'

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly excludedTags?: Array<string>

    /**
     * 
     * @type {'AND' | 'OR'}
     * @memberof MangaApiGetSearchManga
     */
    readonly excludedTagsMode?: 'AND' | 'OR'

    /**
     * 
     * @type {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>}
     * @memberof MangaApiGetSearchManga
     */
    readonly status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly originalLanguage?: Array<string>

    /**
     * 
     * @type {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>}
     * @memberof MangaApiGetSearchManga
     */
    readonly publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>

    /**
     * Manga ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof MangaApiGetSearchManga
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>}
     * @memberof MangaApiGetSearchManga
     */
    readonly contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetSearchManga
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetSearchManga
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof MangaApiGetSearchManga
     */
    readonly order?: object
}

/**
 * Request parameters for getUserFollowsManga operation in MangaApi.
 * @export
 * @interface MangaApiGetUserFollowsMangaRequest
 */
export interface MangaApiGetUserFollowsMangaRequest {
    /**
     * 
     * @type {number}
     * @memberof MangaApiGetUserFollowsManga
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof MangaApiGetUserFollowsManga
     */
    readonly offset?: number
}

/**
 * Request parameters for getUserFollowsMangaFeed operation in MangaApi.
 * @export
 * @interface MangaApiGetUserFollowsMangaFeedRequest
 */
export interface MangaApiGetUserFollowsMangaFeedRequest {
    /**
     * 
     * @type {number}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly offset?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof MangaApiGetUserFollowsMangaFeed
     */
    readonly order?: object
}

/**
 * Request parameters for mangaIdAggregateGet operation in MangaApi.
 * @export
 * @interface MangaApiMangaIdAggregateGetRequest
 */
export interface MangaApiMangaIdAggregateGetRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiMangaIdAggregateGet
     */
    readonly id: string

    /**
     * 
     * @type {Array<string>}
     * @memberof MangaApiMangaIdAggregateGet
     */
    readonly translatedLanguage?: Array<string>
}

/**
 * Request parameters for postManga operation in MangaApi.
 * @export
 * @interface MangaApiPostMangaRequest
 */
export interface MangaApiPostMangaRequest {
    /**
     * The size of the body is limited to 16KB.
     * @type {MangaCreate}
     * @memberof MangaApiPostManga
     */
    readonly mangaCreate?: MangaCreate
}

/**
 * Request parameters for postMangaIdFollow operation in MangaApi.
 * @export
 * @interface MangaApiPostMangaIdFollowRequest
 */
export interface MangaApiPostMangaIdFollowRequest {
    /**
     * 
     * @type {string}
     * @memberof MangaApiPostMangaIdFollow
     */
    readonly id: string
}

/**
 * Request parameters for postMangaIdListListId operation in MangaApi.
 * @export
 * @interface MangaApiPostMangaIdListListIdRequest
 */
export interface MangaApiPostMangaIdListListIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiPostMangaIdListListId
     */
    readonly id: string

    /**
     * CustomList ID
     * @type {string}
     * @memberof MangaApiPostMangaIdListListId
     */
    readonly listId: string
}

/**
 * Request parameters for postMangaIdStatus operation in MangaApi.
 * @export
 * @interface MangaApiPostMangaIdStatusRequest
 */
export interface MangaApiPostMangaIdStatusRequest {
    /**
     * 
     * @type {string}
     * @memberof MangaApiPostMangaIdStatus
     */
    readonly id: string

    /**
     * Using a &#x60;null&#x60; value in &#x60;status&#x60; field will remove the Manga reading status. The size of the body is limited to 2KB.
     * @type {UpdateMangaStatus}
     * @memberof MangaApiPostMangaIdStatus
     */
    readonly updateMangaStatus?: UpdateMangaStatus
}

/**
 * Request parameters for putMangaId operation in MangaApi.
 * @export
 * @interface MangaApiPutMangaIdRequest
 */
export interface MangaApiPutMangaIdRequest {
    /**
     * Manga ID
     * @type {string}
     * @memberof MangaApiPutMangaId
     */
    readonly id: string

    /**
     * The size of the body is limited to 16KB.
     * @type {MangaEdit}
     * @memberof MangaApiPutMangaId
     */
    readonly mangaEdit?: MangaEdit
}

/**
 * MangaApi - object-oriented interface
 * @export
 * @class MangaApi
 * @extends {BaseAPI}
 */
export class MangaApi extends BaseAPI {
    /**
     * 
     * @summary Delete Manga
     * @param {MangaApiDeleteMangaIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public deleteMangaId(requestParameters: MangaApiDeleteMangaIdRequest, options?: any) {
        return MangaApiFp(this.configuration).deleteMangaId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Unfollow Manga
     * @param {MangaApiDeleteMangaIdFollowRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public deleteMangaIdFollow(requestParameters: MangaApiDeleteMangaIdFollowRequest, options?: any) {
        return MangaApiFp(this.configuration).deleteMangaIdFollow(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Remove Manga in CustomList
     * @param {MangaApiDeleteMangaIdListListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public deleteMangaIdListListId(requestParameters: MangaApiDeleteMangaIdListListIdRequest, options?: any) {
        return MangaApiFp(this.configuration).deleteMangaIdListListId(requestParameters.id, requestParameters.listId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * A list of chapter ids that are marked as read for the specified manga
     * @summary Manga read markers
     * @param {MangaApiGetMangaChapterReadmarkersRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaChapterReadmarkers(requestParameters: MangaApiGetMangaChapterReadmarkersRequest, options?: any) {
        return MangaApiFp(this.configuration).getMangaChapterReadmarkers(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * A list of chapter ids that are marked as read for the given manga ids
     * @summary Manga read markers
     * @param {MangaApiGetMangaChapterReadmarkers2Request} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaChapterReadmarkers2(requestParameters: MangaApiGetMangaChapterReadmarkers2Request, options?: any) {
        return MangaApiFp(this.configuration).getMangaChapterReadmarkers2(requestParameters.ids, requestParameters.grouped, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * View Manga.
     * @summary View Manga
     * @param {MangaApiGetMangaIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaId(requestParameters: MangaApiGetMangaIdRequest, options?: any) {
        return MangaApiFp(this.configuration).getMangaId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Manga feed
     * @param {MangaApiGetMangaIdFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaIdFeed(requestParameters: MangaApiGetMangaIdFeedRequest, options?: any) {
        return MangaApiFp(this.configuration).getMangaIdFeed(requestParameters.id, requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get a Manga reading status
     * @param {MangaApiGetMangaIdStatusRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaIdStatus(requestParameters: MangaApiGetMangaIdStatusRequest, options?: any) {
        return MangaApiFp(this.configuration).getMangaIdStatus(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get a random Manga
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaRandom(options?: any) {
        return MangaApiFp(this.configuration).getMangaRandom(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get all Manga reading status for logged User
     * @param {MangaApiGetMangaStatusRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaStatus(requestParameters: MangaApiGetMangaStatusRequest = {}, options?: any) {
        return MangaApiFp(this.configuration).getMangaStatus(requestParameters.status, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Tag list
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getMangaTag(options?: any) {
        return MangaApiFp(this.configuration).getMangaTag(options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Search a list of Manga.
     * @summary Manga list
     * @param {MangaApiGetSearchMangaRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getSearchManga(requestParameters: MangaApiGetSearchMangaRequest = {}, options?: any) {
        return MangaApiFp(this.configuration).getSearchManga(requestParameters.limit, requestParameters.offset, requestParameters.title, requestParameters.authors, requestParameters.artists, requestParameters.year, requestParameters.includedTags, requestParameters.includedTagsMode, requestParameters.excludedTags, requestParameters.excludedTagsMode, requestParameters.status, requestParameters.originalLanguage, requestParameters.publicationDemographic, requestParameters.ids, requestParameters.contentRating, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Manga list
     * @param {MangaApiGetUserFollowsMangaRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getUserFollowsManga(requestParameters: MangaApiGetUserFollowsMangaRequest = {}, options?: any) {
        return MangaApiFp(this.configuration).getUserFollowsManga(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Manga feed (Chapter list)
     * @param {MangaApiGetUserFollowsMangaFeedRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public getUserFollowsMangaFeed(requestParameters: MangaApiGetUserFollowsMangaFeedRequest = {}, options?: any) {
        return MangaApiFp(this.configuration).getUserFollowsMangaFeed(requestParameters.limit, requestParameters.offset, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get Manga volumes & chapters
     * @param {MangaApiMangaIdAggregateGetRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public mangaIdAggregateGet(requestParameters: MangaApiMangaIdAggregateGetRequest, options?: any) {
        return MangaApiFp(this.configuration).mangaIdAggregateGet(requestParameters.id, requestParameters.translatedLanguage, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Create a new Manga.
     * @summary Create Manga
     * @param {MangaApiPostMangaRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public postManga(requestParameters: MangaApiPostMangaRequest = {}, options?: any) {
        return MangaApiFp(this.configuration).postManga(requestParameters.mangaCreate, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Follow Manga
     * @param {MangaApiPostMangaIdFollowRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public postMangaIdFollow(requestParameters: MangaApiPostMangaIdFollowRequest, options?: any) {
        return MangaApiFp(this.configuration).postMangaIdFollow(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Add Manga in CustomList
     * @param {MangaApiPostMangaIdListListIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public postMangaIdListListId(requestParameters: MangaApiPostMangaIdListListIdRequest, options?: any) {
        return MangaApiFp(this.configuration).postMangaIdListListId(requestParameters.id, requestParameters.listId, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Update Manga reading status
     * @param {MangaApiPostMangaIdStatusRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public postMangaIdStatus(requestParameters: MangaApiPostMangaIdStatusRequest, options?: any) {
        return MangaApiFp(this.configuration).postMangaIdStatus(requestParameters.id, requestParameters.updateMangaStatus, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Update Manga
     * @param {MangaApiPutMangaIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MangaApi
     */
    public putMangaId(requestParameters: MangaApiPutMangaIdRequest, options?: any) {
        return MangaApiFp(this.configuration).putMangaId(requestParameters.id, requestParameters.mangaEdit, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * ScanlationGroupApi - axios parameter creator
 * @export
 */
export const ScanlationGroupApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Delete Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteGroupId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteGroupId', 'id', id)
            const localVarPath = `/group/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Unfollow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteGroupIdFollow: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('deleteGroupIdFollow', 'id', id)
            const localVarPath = `/group/{id}/follow`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary View Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getGroupId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getGroupId', 'id', id)
            const localVarPath = `/group/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchGroup: async (limit?: number, offset?: number, ids?: Array<string>, name?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/group`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (name !== undefined) {
                localVarQueryParameter['name'] = name;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsGroup: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/group`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Create Scanlation Group
         * @param {CreateScanlationGroup} [createScanlationGroup] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postGroup: async (createScanlationGroup?: CreateScanlationGroup, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/group`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(createScanlationGroup, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Follow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postGroupIdFollow: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('postGroupIdFollow', 'id', id)
            const localVarPath = `/group/{id}/follow`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Update Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {ScanlationGroupEdit} [scanlationGroupEdit] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putGroupId: async (id: string, scanlationGroupEdit?: ScanlationGroupEdit, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('putGroupId', 'id', id)
            const localVarPath = `/group/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'PUT', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(scanlationGroupEdit, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * ScanlationGroupApi - functional programming interface
 * @export
 */
export const ScanlationGroupApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = ScanlationGroupApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Delete Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteGroupId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteGroupId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Unfollow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async deleteGroupIdFollow(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.deleteGroupIdFollow(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary View Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getGroupId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getGroupId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSearchGroup(limit?: number, offset?: number, ids?: Array<string>, name?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSearchGroup(limit, offset, ids, name, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsGroup(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsGroup(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Create Scanlation Group
         * @param {CreateScanlationGroup} [createScanlationGroup] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postGroup(createScanlationGroup?: CreateScanlationGroup, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postGroup(createScanlationGroup, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Follow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async postGroupIdFollow(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<Response>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.postGroupIdFollow(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Update Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {ScanlationGroupEdit} [scanlationGroupEdit] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async putGroupId(id: string, scanlationGroupEdit?: ScanlationGroupEdit, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.putGroupId(id, scanlationGroupEdit, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * ScanlationGroupApi - factory interface
 * @export
 */
export const ScanlationGroupApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = ScanlationGroupApiFp(configuration)
    return {
        /**
         * 
         * @summary Delete Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteGroupId(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteGroupId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Unfollow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        deleteGroupIdFollow(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.deleteGroupIdFollow(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary View Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getGroupId(id: string, options?: any): AxiosPromise<ScanlationGroupResponse> {
            return localVarFp.getGroupId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchGroup(limit?: number, offset?: number, ids?: Array<string>, name?: string, options?: any): AxiosPromise<ScanlationGroupList> {
            return localVarFp.getSearchGroup(limit, offset, ids, name, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsGroup(limit?: number, offset?: number, options?: any): AxiosPromise<ScanlationGroupList> {
            return localVarFp.getUserFollowsGroup(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Create Scanlation Group
         * @param {CreateScanlationGroup} [createScanlationGroup] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postGroup(createScanlationGroup?: CreateScanlationGroup, options?: any): AxiosPromise<ScanlationGroupResponse> {
            return localVarFp.postGroup(createScanlationGroup, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Follow Scanlation Group
         * @param {string} id 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        postGroupIdFollow(id: string, options?: any): AxiosPromise<Response> {
            return localVarFp.postGroupIdFollow(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Update Scanlation Group
         * @param {string} id Scanlation Group ID
         * @param {ScanlationGroupEdit} [scanlationGroupEdit] The size of the body is limited to 8KB.
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        putGroupId(id: string, scanlationGroupEdit?: ScanlationGroupEdit, options?: any): AxiosPromise<ScanlationGroupResponse> {
            return localVarFp.putGroupId(id, scanlationGroupEdit, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for deleteGroupId operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiDeleteGroupIdRequest
 */
export interface ScanlationGroupApiDeleteGroupIdRequest {
    /**
     * Scanlation Group ID
     * @type {string}
     * @memberof ScanlationGroupApiDeleteGroupId
     */
    readonly id: string
}

/**
 * Request parameters for deleteGroupIdFollow operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiDeleteGroupIdFollowRequest
 */
export interface ScanlationGroupApiDeleteGroupIdFollowRequest {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupApiDeleteGroupIdFollow
     */
    readonly id: string
}

/**
 * Request parameters for getGroupId operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiGetGroupIdRequest
 */
export interface ScanlationGroupApiGetGroupIdRequest {
    /**
     * Scanlation Group ID
     * @type {string}
     * @memberof ScanlationGroupApiGetGroupId
     */
    readonly id: string
}

/**
 * Request parameters for getSearchGroup operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiGetSearchGroupRequest
 */
export interface ScanlationGroupApiGetSearchGroupRequest {
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupApiGetSearchGroup
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupApiGetSearchGroup
     */
    readonly offset?: number

    /**
     * ScanlationGroup ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof ScanlationGroupApiGetSearchGroup
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupApiGetSearchGroup
     */
    readonly name?: string
}

/**
 * Request parameters for getUserFollowsGroup operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiGetUserFollowsGroupRequest
 */
export interface ScanlationGroupApiGetUserFollowsGroupRequest {
    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupApiGetUserFollowsGroup
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof ScanlationGroupApiGetUserFollowsGroup
     */
    readonly offset?: number
}

/**
 * Request parameters for postGroup operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiPostGroupRequest
 */
export interface ScanlationGroupApiPostGroupRequest {
    /**
     * The size of the body is limited to 8KB.
     * @type {CreateScanlationGroup}
     * @memberof ScanlationGroupApiPostGroup
     */
    readonly createScanlationGroup?: CreateScanlationGroup
}

/**
 * Request parameters for postGroupIdFollow operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiPostGroupIdFollowRequest
 */
export interface ScanlationGroupApiPostGroupIdFollowRequest {
    /**
     * 
     * @type {string}
     * @memberof ScanlationGroupApiPostGroupIdFollow
     */
    readonly id: string
}

/**
 * Request parameters for putGroupId operation in ScanlationGroupApi.
 * @export
 * @interface ScanlationGroupApiPutGroupIdRequest
 */
export interface ScanlationGroupApiPutGroupIdRequest {
    /**
     * Scanlation Group ID
     * @type {string}
     * @memberof ScanlationGroupApiPutGroupId
     */
    readonly id: string

    /**
     * The size of the body is limited to 8KB.
     * @type {ScanlationGroupEdit}
     * @memberof ScanlationGroupApiPutGroupId
     */
    readonly scanlationGroupEdit?: ScanlationGroupEdit
}

/**
 * ScanlationGroupApi - object-oriented interface
 * @export
 * @class ScanlationGroupApi
 * @extends {BaseAPI}
 */
export class ScanlationGroupApi extends BaseAPI {
    /**
     * 
     * @summary Delete Scanlation Group
     * @param {ScanlationGroupApiDeleteGroupIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public deleteGroupId(requestParameters: ScanlationGroupApiDeleteGroupIdRequest, options?: any) {
        return ScanlationGroupApiFp(this.configuration).deleteGroupId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Unfollow Scanlation Group
     * @param {ScanlationGroupApiDeleteGroupIdFollowRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public deleteGroupIdFollow(requestParameters: ScanlationGroupApiDeleteGroupIdFollowRequest, options?: any) {
        return ScanlationGroupApiFp(this.configuration).deleteGroupIdFollow(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary View Scanlation Group
     * @param {ScanlationGroupApiGetGroupIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public getGroupId(requestParameters: ScanlationGroupApiGetGroupIdRequest, options?: any) {
        return ScanlationGroupApiFp(this.configuration).getGroupId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Scanlation Group list
     * @param {ScanlationGroupApiGetSearchGroupRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public getSearchGroup(requestParameters: ScanlationGroupApiGetSearchGroupRequest = {}, options?: any) {
        return ScanlationGroupApiFp(this.configuration).getSearchGroup(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.name, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Groups
     * @param {ScanlationGroupApiGetUserFollowsGroupRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public getUserFollowsGroup(requestParameters: ScanlationGroupApiGetUserFollowsGroupRequest = {}, options?: any) {
        return ScanlationGroupApiFp(this.configuration).getUserFollowsGroup(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Create Scanlation Group
     * @param {ScanlationGroupApiPostGroupRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public postGroup(requestParameters: ScanlationGroupApiPostGroupRequest = {}, options?: any) {
        return ScanlationGroupApiFp(this.configuration).postGroup(requestParameters.createScanlationGroup, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Follow Scanlation Group
     * @param {ScanlationGroupApiPostGroupIdFollowRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public postGroupIdFollow(requestParameters: ScanlationGroupApiPostGroupIdFollowRequest, options?: any) {
        return ScanlationGroupApiFp(this.configuration).postGroupIdFollow(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Update Scanlation Group
     * @param {ScanlationGroupApiPutGroupIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ScanlationGroupApi
     */
    public putGroupId(requestParameters: ScanlationGroupApiPutGroupIdRequest, options?: any) {
        return ScanlationGroupApiFp(this.configuration).putGroupId(requestParameters.id, requestParameters.scanlationGroupEdit, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * SearchApi - axios parameter creator
 * @export
 */
export const SearchApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthor: async (limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/author`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (name !== undefined) {
                localVarQueryParameter['name'] = name;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapter: async (limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/chapter`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (title !== undefined) {
                localVarQueryParameter['title'] = title;
            }

            if (groups) {
                localVarQueryParameter['groups'] = groups;
            }

            if (uploader !== undefined) {
                localVarQueryParameter['uploader'] = uploader;
            }

            if (manga !== undefined) {
                localVarQueryParameter['manga'] = manga;
            }

            if (volume !== undefined) {
                localVarQueryParameter['volume'] = volume;
            }

            if (chapter !== undefined) {
                localVarQueryParameter['chapter'] = chapter;
            }

            if (translatedLanguage) {
                localVarQueryParameter['translatedLanguage'] = translatedLanguage;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (publishAtSince !== undefined) {
                localVarQueryParameter['publishAtSince'] = publishAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCover: async (limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/cover`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (manga) {
                localVarQueryParameter['manga'] = manga;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (uploaders) {
                localVarQueryParameter['uploaders'] = uploaders;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchGroup: async (limit?: number, offset?: number, ids?: Array<string>, name?: string, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/group`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (name !== undefined) {
                localVarQueryParameter['name'] = name;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchManga: async (limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/manga`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }

            if (title !== undefined) {
                localVarQueryParameter['title'] = title;
            }

            if (authors) {
                localVarQueryParameter['authors'] = authors;
            }

            if (artists) {
                localVarQueryParameter['artists'] = artists;
            }

            if (year !== undefined) {
                localVarQueryParameter['year'] = year;
            }

            if (includedTags) {
                localVarQueryParameter['includedTags'] = includedTags;
            }

            if (includedTagsMode !== undefined) {
                localVarQueryParameter['includedTagsMode'] = includedTagsMode;
            }

            if (excludedTags) {
                localVarQueryParameter['excludedTags'] = excludedTags;
            }

            if (excludedTagsMode !== undefined) {
                localVarQueryParameter['excludedTagsMode'] = excludedTagsMode;
            }

            if (status) {
                localVarQueryParameter['status'] = status;
            }

            if (originalLanguage) {
                localVarQueryParameter['originalLanguage'] = originalLanguage;
            }

            if (publicationDemographic) {
                localVarQueryParameter['publicationDemographic'] = publicationDemographic;
            }

            if (ids) {
                localVarQueryParameter['ids'] = ids;
            }

            if (contentRating) {
                localVarQueryParameter['contentRating'] = contentRating;
            }

            if (createdAtSince !== undefined) {
                localVarQueryParameter['createdAtSince'] = createdAtSince;
            }

            if (updatedAtSince !== undefined) {
                localVarQueryParameter['updatedAtSince'] = updatedAtSince;
            }

            if (order !== undefined) {
                localVarQueryParameter['order'] = order;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * SearchApi - functional programming interface
 * @export
 */
export const SearchApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = SearchApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getAuthor(limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<AuthorList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getAuthor(limit, offset, ids, name, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getChapter(limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ChapterList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getChapter(limit, offset, ids, title, groups, uploader, manga, volume, chapter, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getCover(limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getCover(limit, offset, manga, ids, uploaders, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSearchGroup(limit?: number, offset?: number, ids?: Array<string>, name?: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSearchGroup(limit, offset, ids, name, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getSearchManga(limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getSearchManga(limit, offset, title, authors, artists, year, includedTags, includedTagsMode, excludedTags, excludedTagsMode, status, originalLanguage, publicationDemographic, ids, contentRating, createdAtSince, updatedAtSince, order, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * SearchApi - factory interface
 * @export
 */
export const SearchApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = SearchApiFp(configuration)
    return {
        /**
         * 
         * @summary Author list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Author ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getAuthor(limit?: number, offset?: number, ids?: Array<string>, name?: string, order?: object, options?: any): AxiosPromise<AuthorList> {
            return localVarFp.getAuthor(limit, offset, ids, name, order, options).then((request) => request(axios, basePath));
        },
        /**
         * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
         * @summary Chapter list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] Chapter ids (limited to 100 per request)
         * @param {string} [title] 
         * @param {Array<string>} [groups] 
         * @param {string} [uploader] 
         * @param {string} [manga] 
         * @param {string | Array<string>} [volume] 
         * @param {string | Array<string>} [chapter] 
         * @param {Array<string>} [translatedLanguage] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {string} [publishAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getChapter(limit?: number, offset?: number, ids?: Array<string>, title?: string, groups?: Array<string>, uploader?: string, manga?: string, volume?: string | Array<string>, chapter?: string | Array<string>, translatedLanguage?: Array<string>, createdAtSince?: string, updatedAtSince?: string, publishAtSince?: string, order?: object, options?: any): AxiosPromise<ChapterList> {
            return localVarFp.getChapter(limit, offset, ids, title, groups, uploader, manga, volume, chapter, translatedLanguage, createdAtSince, updatedAtSince, publishAtSince, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary CoverArt list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [manga] Manga ids (limited to 100 per request)
         * @param {Array<string>} [ids] Covers ids (limited to 100 per request)
         * @param {Array<string>} [uploaders] User ids (limited to 100 per request)
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getCover(limit?: number, offset?: number, manga?: Array<string>, ids?: Array<string>, uploaders?: Array<string>, order?: object, options?: any): AxiosPromise<CoverList> {
            return localVarFp.getCover(limit, offset, manga, ids, uploaders, order, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Scanlation Group list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {Array<string>} [ids] ScanlationGroup ids (limited to 100 per request)
         * @param {string} [name] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchGroup(limit?: number, offset?: number, ids?: Array<string>, name?: string, options?: any): AxiosPromise<ScanlationGroupList> {
            return localVarFp.getSearchGroup(limit, offset, ids, name, options).then((request) => request(axios, basePath));
        },
        /**
         * Search a list of Manga.
         * @summary Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {string} [title] 
         * @param {Array<string>} [authors] 
         * @param {Array<string>} [artists] 
         * @param {number} [year] Year of release
         * @param {Array<string>} [includedTags] 
         * @param {'AND' | 'OR'} [includedTagsMode] 
         * @param {Array<string>} [excludedTags] 
         * @param {'AND' | 'OR'} [excludedTagsMode] 
         * @param {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>} [status] 
         * @param {Array<string>} [originalLanguage] 
         * @param {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>} [publicationDemographic] 
         * @param {Array<string>} [ids] Manga ids (limited to 100 per request)
         * @param {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>} [contentRating] 
         * @param {string} [createdAtSince] 
         * @param {string} [updatedAtSince] 
         * @param {object} [order] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getSearchManga(limit?: number, offset?: number, title?: string, authors?: Array<string>, artists?: Array<string>, year?: number, includedTags?: Array<string>, includedTagsMode?: 'AND' | 'OR', excludedTags?: Array<string>, excludedTagsMode?: 'AND' | 'OR', status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>, originalLanguage?: Array<string>, publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>, ids?: Array<string>, contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>, createdAtSince?: string, updatedAtSince?: string, order?: object, options?: any): AxiosPromise<MangaList> {
            return localVarFp.getSearchManga(limit, offset, title, authors, artists, year, includedTags, includedTagsMode, excludedTags, excludedTagsMode, status, originalLanguage, publicationDemographic, ids, contentRating, createdAtSince, updatedAtSince, order, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for getAuthor operation in SearchApi.
 * @export
 * @interface SearchApiGetAuthorRequest
 */
export interface SearchApiGetAuthorRequest {
    /**
     * 
     * @type {number}
     * @memberof SearchApiGetAuthor
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof SearchApiGetAuthor
     */
    readonly offset?: number

    /**
     * Author ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetAuthor
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetAuthor
     */
    readonly name?: string

    /**
     * 
     * @type {object}
     * @memberof SearchApiGetAuthor
     */
    readonly order?: object
}

/**
 * Request parameters for getChapter operation in SearchApi.
 * @export
 * @interface SearchApiGetChapterRequest
 */
export interface SearchApiGetChapterRequest {
    /**
     * 
     * @type {number}
     * @memberof SearchApiGetChapter
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof SearchApiGetChapter
     */
    readonly offset?: number

    /**
     * Chapter ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetChapter
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly title?: string

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetChapter
     */
    readonly groups?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly uploader?: string

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly manga?: string

    /**
     * 
     * @type {string | Array<string>}
     * @memberof SearchApiGetChapter
     */
    readonly volume?: string | Array<string>

    /**
     * 
     * @type {string | Array<string>}
     * @memberof SearchApiGetChapter
     */
    readonly chapter?: string | Array<string>

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetChapter
     */
    readonly translatedLanguage?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetChapter
     */
    readonly publishAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof SearchApiGetChapter
     */
    readonly order?: object
}

/**
 * Request parameters for getCover operation in SearchApi.
 * @export
 * @interface SearchApiGetCoverRequest
 */
export interface SearchApiGetCoverRequest {
    /**
     * 
     * @type {number}
     * @memberof SearchApiGetCover
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof SearchApiGetCover
     */
    readonly offset?: number

    /**
     * Manga ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetCover
     */
    readonly manga?: Array<string>

    /**
     * Covers ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetCover
     */
    readonly ids?: Array<string>

    /**
     * User ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetCover
     */
    readonly uploaders?: Array<string>

    /**
     * 
     * @type {object}
     * @memberof SearchApiGetCover
     */
    readonly order?: object
}

/**
 * Request parameters for getSearchGroup operation in SearchApi.
 * @export
 * @interface SearchApiGetSearchGroupRequest
 */
export interface SearchApiGetSearchGroupRequest {
    /**
     * 
     * @type {number}
     * @memberof SearchApiGetSearchGroup
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof SearchApiGetSearchGroup
     */
    readonly offset?: number

    /**
     * ScanlationGroup ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetSearchGroup
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetSearchGroup
     */
    readonly name?: string
}

/**
 * Request parameters for getSearchManga operation in SearchApi.
 * @export
 * @interface SearchApiGetSearchMangaRequest
 */
export interface SearchApiGetSearchMangaRequest {
    /**
     * 
     * @type {number}
     * @memberof SearchApiGetSearchManga
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof SearchApiGetSearchManga
     */
    readonly offset?: number

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetSearchManga
     */
    readonly title?: string

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly authors?: Array<string>

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly artists?: Array<string>

    /**
     * Year of release
     * @type {number}
     * @memberof SearchApiGetSearchManga
     */
    readonly year?: number

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly includedTags?: Array<string>

    /**
     * 
     * @type {'AND' | 'OR'}
     * @memberof SearchApiGetSearchManga
     */
    readonly includedTagsMode?: 'AND' | 'OR'

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly excludedTags?: Array<string>

    /**
     * 
     * @type {'AND' | 'OR'}
     * @memberof SearchApiGetSearchManga
     */
    readonly excludedTagsMode?: 'AND' | 'OR'

    /**
     * 
     * @type {Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>}
     * @memberof SearchApiGetSearchManga
     */
    readonly status?: Array<'ongoing' | 'completed' | 'hiatus' | 'cancelled'>

    /**
     * 
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly originalLanguage?: Array<string>

    /**
     * 
     * @type {Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>}
     * @memberof SearchApiGetSearchManga
     */
    readonly publicationDemographic?: Array<'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'>

    /**
     * Manga ids (limited to 100 per request)
     * @type {Array<string>}
     * @memberof SearchApiGetSearchManga
     */
    readonly ids?: Array<string>

    /**
     * 
     * @type {Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>}
     * @memberof SearchApiGetSearchManga
     */
    readonly contentRating?: Array<'none' | 'safe' | 'suggestive' | 'erotica' | 'pornographic'>

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetSearchManga
     */
    readonly createdAtSince?: string

    /**
     * 
     * @type {string}
     * @memberof SearchApiGetSearchManga
     */
    readonly updatedAtSince?: string

    /**
     * 
     * @type {object}
     * @memberof SearchApiGetSearchManga
     */
    readonly order?: object
}

/**
 * SearchApi - object-oriented interface
 * @export
 * @class SearchApi
 * @extends {BaseAPI}
 */
export class SearchApi extends BaseAPI {
    /**
     * 
     * @summary Author list
     * @param {SearchApiGetAuthorRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SearchApi
     */
    public getAuthor(requestParameters: SearchApiGetAuthorRequest = {}, options?: any) {
        return SearchApiFp(this.configuration).getAuthor(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.name, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Chapter list. If you want the Chapters of a given Manga, please check the feed endpoints.
     * @summary Chapter list
     * @param {SearchApiGetChapterRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SearchApi
     */
    public getChapter(requestParameters: SearchApiGetChapterRequest = {}, options?: any) {
        return SearchApiFp(this.configuration).getChapter(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.title, requestParameters.groups, requestParameters.uploader, requestParameters.manga, requestParameters.volume, requestParameters.chapter, requestParameters.translatedLanguage, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.publishAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary CoverArt list
     * @param {SearchApiGetCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SearchApi
     */
    public getCover(requestParameters: SearchApiGetCoverRequest = {}, options?: any) {
        return SearchApiFp(this.configuration).getCover(requestParameters.limit, requestParameters.offset, requestParameters.manga, requestParameters.ids, requestParameters.uploaders, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Scanlation Group list
     * @param {SearchApiGetSearchGroupRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SearchApi
     */
    public getSearchGroup(requestParameters: SearchApiGetSearchGroupRequest = {}, options?: any) {
        return SearchApiFp(this.configuration).getSearchGroup(requestParameters.limit, requestParameters.offset, requestParameters.ids, requestParameters.name, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Search a list of Manga.
     * @summary Manga list
     * @param {SearchApiGetSearchMangaRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof SearchApi
     */
    public getSearchManga(requestParameters: SearchApiGetSearchMangaRequest = {}, options?: any) {
        return SearchApiFp(this.configuration).getSearchManga(requestParameters.limit, requestParameters.offset, requestParameters.title, requestParameters.authors, requestParameters.artists, requestParameters.year, requestParameters.includedTags, requestParameters.includedTagsMode, requestParameters.excludedTags, requestParameters.excludedTagsMode, requestParameters.status, requestParameters.originalLanguage, requestParameters.publicationDemographic, requestParameters.ids, requestParameters.contentRating, requestParameters.createdAtSince, requestParameters.updatedAtSince, requestParameters.order, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * UploadApi - axios parameter creator
 * @export
 */
export const UploadApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        uploadCover: async (mangaId: string, file?: any, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'mangaId' is not null or undefined
            assertParamExists('uploadCover', 'mangaId', mangaId)
            const localVarPath = `/cover/{mangaId}`
                .replace(`{${"mangaId"}}`, encodeURIComponent(String(mangaId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;
            const localVarFormParams = new ((configuration && configuration.formDataCtor) || FormData)();

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


            if (file !== undefined) { 
                localVarFormParams.append('file', file as any);
            }
    
    
            localVarHeaderParameter['Content-Type'] = 'multipart/form-data';
    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = localVarFormParams;

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * UploadApi - functional programming interface
 * @export
 */
export const UploadApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = UploadApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async uploadCover(mangaId: string, file?: any, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<CoverResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.uploadCover(mangaId, file, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * UploadApi - factory interface
 * @export
 */
export const UploadApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = UploadApiFp(configuration)
    return {
        /**
         * 
         * @summary Upload Cover
         * @param {string} mangaId 
         * @param {any} [file] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        uploadCover(mangaId: string, file?: any, options?: any): AxiosPromise<CoverResponse> {
            return localVarFp.uploadCover(mangaId, file, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for uploadCover operation in UploadApi.
 * @export
 * @interface UploadApiUploadCoverRequest
 */
export interface UploadApiUploadCoverRequest {
    /**
     * 
     * @type {string}
     * @memberof UploadApiUploadCover
     */
    readonly mangaId: string

    /**
     * 
     * @type {any}
     * @memberof UploadApiUploadCover
     */
    readonly file?: any
}

/**
 * UploadApi - object-oriented interface
 * @export
 * @class UploadApi
 * @extends {BaseAPI}
 */
export class UploadApi extends BaseAPI {
    /**
     * 
     * @summary Upload Cover
     * @param {UploadApiUploadCoverRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UploadApi
     */
    public uploadCover(requestParameters: UploadApiUploadCoverRequest, options?: any) {
        return UploadApiFp(this.configuration).uploadCover(requestParameters.mangaId, requestParameters.file, options).then((request) => request(this.axios, this.basePath));
    }
}


/**
 * UserApi - axios parameter creator
 * @export
 */
export const UserApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsGroup: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/group`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsManga: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/manga`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get logged User followed User list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsUser: async (limit?: number, offset?: number, options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/follows/user`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)

            if (limit !== undefined) {
                localVarQueryParameter['limit'] = limit;
            }

            if (offset !== undefined) {
                localVarQueryParameter['offset'] = offset;
            }


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Get User
         * @param {string} id User ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserId: async (id: string, options: any = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('getUserId', 'id', id)
            const localVarPath = `/user/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * 
         * @summary Logged User details
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserMe: async (options: any = {}): Promise<RequestArgs> => {
            const localVarPath = `/user/me`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            // authentication Bearer required
            // http bearer authentication required
            await setBearerAuthToObject(localVarHeaderParameter, configuration)


    
            setSearchParams(localVarUrlObj, localVarQueryParameter, options.query);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * UserApi - functional programming interface
 * @export
 */
export const UserApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = UserApiAxiosParamCreator(configuration)
    return {
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsGroup(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<ScanlationGroupList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsGroup(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsManga(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<MangaList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsManga(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get logged User followed User list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserFollowsUser(limit?: number, offset?: number, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<UserList>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserFollowsUser(limit, offset, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Get User
         * @param {string} id User ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserId(id: string, options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<UserResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserId(id, options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
        /**
         * 
         * @summary Logged User details
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async getUserMe(options?: any): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<UserResponse>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.getUserMe(options);
            return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
        },
    }
};

/**
 * UserApi - factory interface
 * @export
 */
export const UserApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = UserApiFp(configuration)
    return {
        /**
         * 
         * @summary Get logged User followed Groups
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsGroup(limit?: number, offset?: number, options?: any): AxiosPromise<ScanlationGroupList> {
            return localVarFp.getUserFollowsGroup(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed Manga list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsManga(limit?: number, offset?: number, options?: any): AxiosPromise<MangaList> {
            return localVarFp.getUserFollowsManga(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get logged User followed User list
         * @param {number} [limit] 
         * @param {number} [offset] 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserFollowsUser(limit?: number, offset?: number, options?: any): AxiosPromise<UserList> {
            return localVarFp.getUserFollowsUser(limit, offset, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Get User
         * @param {string} id User ID
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserId(id: string, options?: any): AxiosPromise<UserResponse> {
            return localVarFp.getUserId(id, options).then((request) => request(axios, basePath));
        },
        /**
         * 
         * @summary Logged User details
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getUserMe(options?: any): AxiosPromise<UserResponse> {
            return localVarFp.getUserMe(options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * Request parameters for getUserFollowsGroup operation in UserApi.
 * @export
 * @interface UserApiGetUserFollowsGroupRequest
 */
export interface UserApiGetUserFollowsGroupRequest {
    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsGroup
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsGroup
     */
    readonly offset?: number
}

/**
 * Request parameters for getUserFollowsManga operation in UserApi.
 * @export
 * @interface UserApiGetUserFollowsMangaRequest
 */
export interface UserApiGetUserFollowsMangaRequest {
    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsManga
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsManga
     */
    readonly offset?: number
}

/**
 * Request parameters for getUserFollowsUser operation in UserApi.
 * @export
 * @interface UserApiGetUserFollowsUserRequest
 */
export interface UserApiGetUserFollowsUserRequest {
    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsUser
     */
    readonly limit?: number

    /**
     * 
     * @type {number}
     * @memberof UserApiGetUserFollowsUser
     */
    readonly offset?: number
}

/**
 * Request parameters for getUserId operation in UserApi.
 * @export
 * @interface UserApiGetUserIdRequest
 */
export interface UserApiGetUserIdRequest {
    /**
     * User ID
     * @type {string}
     * @memberof UserApiGetUserId
     */
    readonly id: string
}

/**
 * UserApi - object-oriented interface
 * @export
 * @class UserApi
 * @extends {BaseAPI}
 */
export class UserApi extends BaseAPI {
    /**
     * 
     * @summary Get logged User followed Groups
     * @param {UserApiGetUserFollowsGroupRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    public getUserFollowsGroup(requestParameters: UserApiGetUserFollowsGroupRequest = {}, options?: any) {
        return UserApiFp(this.configuration).getUserFollowsGroup(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed Manga list
     * @param {UserApiGetUserFollowsMangaRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    public getUserFollowsManga(requestParameters: UserApiGetUserFollowsMangaRequest = {}, options?: any) {
        return UserApiFp(this.configuration).getUserFollowsManga(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get logged User followed User list
     * @param {UserApiGetUserFollowsUserRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    public getUserFollowsUser(requestParameters: UserApiGetUserFollowsUserRequest = {}, options?: any) {
        return UserApiFp(this.configuration).getUserFollowsUser(requestParameters.limit, requestParameters.offset, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Get User
     * @param {UserApiGetUserIdRequest} requestParameters Request parameters.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    public getUserId(requestParameters: UserApiGetUserIdRequest, options?: any) {
        return UserApiFp(this.configuration).getUserId(requestParameters.id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * 
     * @summary Logged User details
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserApi
     */
    public getUserMe(options?: any) {
        return UserApiFp(this.configuration).getUserMe(options).then((request) => request(this.axios, this.basePath));
    }
}


