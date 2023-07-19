import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Status } from '../enum/status.enum';
import { CustomResponse } from '../interface/custom-response';
import { Server } from '../interface/server';


@Injectable({ providedIn: 'root' })
export class ServerService {
  private readonly apiURL = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  //Procedural way to retrieve data from the back
  getServer(): Observable<CustomResponse> {
    return this.http.get<CustomResponse>(`http://localhost:8080/server/list`);
  }

  //Reactive approach
  servers$ = <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiURL}/server/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  save$ = (server: Server) => <Observable<CustomResponse>>
    this.http.post<CustomResponse>(`${this.apiURL}/server/save`, server)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  ping$ = (ipAddress: string) => <Observable<CustomResponse>>
    this.http.get<CustomResponse>(`${this.apiURL}/server/ping/${ipAddress}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  delete$ = (ServerId: number) => <Observable<CustomResponse>>
    this.http.delete<CustomResponse>(`${this.apiURL}/server/delete/${ServerId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  filtre$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      subscriber => {
        console.log(response);
        subscriber.next(
          status === Status.ALL ? { ...response, message: `Servers filtred by ${status} status` } :
            {
              ...response,
              message: response.data.servers
                .filter(server => server.status === status).length > 0 ?
                `Server filtred by ${status === Status.SERVER_DOWN ? 'SERVER DOWN' : 'SERVER UP'} status` : `No server of ${status} found`,
              data: { servers: response.data.servers.filter(server => server.status === status) }
            }
        );
        subscriber.complete();
      }
    ).pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    throw new Error(`An error occured - Error code: ${error.status}`);
  }
}
