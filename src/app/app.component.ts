import { Component, OnInit } from '@angular/core';
import { ServerService } from './service/server.service';
import { Observable, catchError, map, tap, of, startWith, BehaviorSubject } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Status } from './enum/status.enum';
import { Server } from './interface/server';
import { NgForm } from '@angular/forms';
import { NotifierService } from 'angular-notifier';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  status = Status.ALL;
  private filtreSubject = new BehaviorSubject<String>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filtreStatus$ = this.filtreSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.filtreSubject.asObservable();
  private readonly notifier: NotifierService;


  constructor(private serverService: ServerService, notifierService: NotifierService) {
    this.notifier = notifierService;
   }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: {...response, data: { servers: response.data.servers.reverse() } } 
        }
        }),
        tap(console.log),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          this.notifier.notify('error', error);
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  pingServer(ipAddress: string): void {
    this.filtreSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
    .pipe(
      map(response => {
        const index = this.dataSubject.value.data.servers.findIndex(server => server.id === response.data.server.id);
        this.dataSubject.value.data.servers[index] = response.data.server;
        this.filtreSubject.next('');
        this.notifier.notify('success', response.message);
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((error: string) => {
        this.filtreSubject.next('');
        this.notifier.notify('error', error);
        return of({ dataState: DataState.ERROR_STATE, error })
      })
    );
  } 

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
    .pipe(
      map(response => {
        this.dataSubject.next(
          {...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] } }
        );
        document.getElementById('closeModal').click();
        serverForm.resetForm({ status : this.Status.SERVER_DOWN});
        this.notifier.notify('success', 'The server has been successfully added!');
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((error: string) => {
        this.isLoading.next(false);
        this.notifier.notify('error', error);
        return of({ dataState: DataState.ERROR_STATE, error })
      })
    );
  } 

  filterServers(status : Status): void {
    this.appState$ = this.serverService.filtre$(status, this.dataSubject.value)
    .pipe(
      map(response => {
        this.notifier.notify('info', response.message);
        return { dataState: DataState.LOADED_STATE, appData : response }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData : this.dataSubject.value }),
      catchError((error: string) => {
        this.notifier.notify('error', error);
        return of({ dataState : DataState.ERROR_STATE, error});
      })
    );
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
      map(response => {
        this.dataSubject.next(
          { ...response, data: { servers: this.dataSubject.value.data.servers.filter(s => s.id !== server.id) }}
        );
        this.notifier.notify('info', response.message);
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData : this.dataSubject.value }),
      catchError((error: string) => {
        this.notifier.notify('error', error);
        return of({ dataState : DataState.ERROR_STATE, error});
      })
    );
  }

  printServers(): void {
    //Print with PDF Format
    //window.print();

    //Print with xls Format
    let dataType ='application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect= document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downLoadLink = document.createElement('a');

    document.body.appendChild(downLoadLink);
    downLoadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downLoadLink.download = 'server-report.xls';
    downLoadLink.click();
    document.body.removeChild(downLoadLink);
 
  }

}
