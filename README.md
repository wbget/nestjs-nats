#  nats for nestjs  

# install  
```
npm install -S @wbget/nestjs-nats 
```
# use  
```
@Module({
    imports: [NatsModule.forRoot({
      servers:['demo.nats.io:4222']
    })],
})
export class AppMoudle implements OnModuleInit{
    constructor(
      private readonly natsLoader: NatsLoader
    ) {}
    async onModuleInit() {
        await this.natsLoader.loadNats();
    }
}


@Nats({ name: 'A' }) // declare a nats
export class A {
  constructor(private readonly client: NatsClient) {
      // inject use 
  }
  @OnRequest({ route: 'hello', queue: 'hello' })
  async do(data: any, connect: NatsClient) {
    // subscribe on respond
    connect.emit('hi', data);
    return { a: 1 };
  }
  @OnPublish({route: 'hi'})
  async dodo(data: any, connect) {
    // subscribe on publish
    this.client.on('todo', (data) => {
        console.log(data);
    });
  }
}

```