import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export const AXIOS_INSTANCE = axios.create({ baseURL: '' })

export const request = <T>(config: AxiosRequestConfig): Promise<T> => {
  return AXIOS_INSTANCE({ ...config }).then((res: AxiosResponse<T>) => res.data)
}

export default request
