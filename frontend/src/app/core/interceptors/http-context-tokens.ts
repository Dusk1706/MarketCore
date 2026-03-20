import { HttpContextToken } from '@angular/common/http';

export const BYPASS_GLOBAL_HTTP_ERROR_HANDLER = new HttpContextToken<boolean>(() => false);
export const SKIP_BEARER_AUTH = new HttpContextToken<boolean>(() => false);
