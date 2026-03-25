// BIOTIME
import * as sql_log_universal         from "./sql_log_universal";
import * as zkteco_auth_biotime       from "./zkteco_auth_biotime";
import * as zkteco_personnel_biotime  from "./zkteco_personnel_biotime";
import * as zkteco_device_biotime     from "./zkteco_device_biotime";

export const api = {
  sql_log_universal,
};


export const zkteco = {
  zkteco_auth_biotime,
  zkteco_personnel_biotime,
  zkteco_device_biotime,
};