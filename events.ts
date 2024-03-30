interface IEventHandlerMetadata {
  description: string;
  dependencies?: string[];
  dispatch?: string[];
}
interface IEventHandler<T = any> {
  (...args: any[]): void;
  metadata?: IEventHandlerMetadata;
}

class EventManager {
  private globalErrorHandler?: (error: unknown, eventName: string, handler: IEventHandler) => void;
  private events_handlers: Map<string, IEventHandler<any>[]> = new Map();

  public on<T>(eventName: string, handler: IEventHandler<T>, metadata?: IEventHandlerMetadata): void {
    if (metadata) {
      handler.metadata = metadata;
    }
    const handlers = this.events_handlers.get(eventName) || [];
    handlers.push(handler);
    this.events_handlers.set(eventName, handlers);
  }

  public off<T>(eventName: string, handler?: IEventHandler<T>): void {
    const handlers = this.events_handlers.get(eventName);
    if (handlers) {
      if (handler) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
          if (handlers.length === 0) {
            this.events_handlers.delete(eventName);
          } else {
            this.events_handlers.set(eventName, handlers);
          }
        }
      } else {
        this.events_handlers.delete(eventName);
      }
    }
  }

  public once<T>(eventName: string, handler: IEventHandler<T>): void {
    const onceHandler:IEventHandler<T> = (args: T) => {
      handler(args);
      this.off(eventName, onceHandler);
    };
    this.on(eventName, onceHandler);
  }

  public clear(eventName?: string): void {
    if (eventName) {
      this.off(eventName);
    }
  }

  public setGlobalErrorHandler(handler: (error: unknown, eventName: string) => void): void {
    this.globalErrorHandler = handler ?? console.log;
  }

  public emit(eventName: string, ...args: any[]): void {
    const handlers = this.events_handlers.get(eventName);
    if (handlers) {
      handlers.slice().forEach((handler: IEventHandler) => {
        try {
          handler(...args);
        } catch (error) {
          if (this.globalErrorHandler) {
            this.globalErrorHandler(error, eventName, handler);
          } else {
            console.error(`Error executing handler for event '${eventName}': ${error}`);
          }
        }
      });
    }
  }

  //--------------------------------------
  //for debugging and audit
  //--------------------------------------
  private getFunctionSignature(handler: Function): string {
    const funcStr = handler.toString();
    const funcNameMatch = funcStr.match(/^\s*function\s*(\w*)\s*\(([^)]*)\)/) || funcStr.match(/^\s*(\w*)\s*=\s*\(([^)]*)\)/) || funcStr.match(/^\s*(\w*)\s*\(([^)]*)\)/);
    const funcName = funcNameMatch ? funcNameMatch[1] || 'anonymous' : 'anonymous';
    const params = funcNameMatch ? funcNameMatch[2] : '';
    return `${funcName}(${params})`;
  }

  private generateHandlerDescription(handler: IEventHandler, index: number): string[] {
    const lines: string[] = [];
    const signature = this.getFunctionSignature(handler);
    lines.push(`  Handler ${index + 1}: ${signature}`);
    if (handler.metadata) {
      lines.push(`    Description: ${handler.metadata.description}`);
      if (handler.metadata.dependencies && handler.metadata.dependencies.length > 0) {
        lines.push(`    Dependencies: ${handler.metadata.dependencies.join(', ')}`);
      }
      if (handler.metadata.dispatch && handler.metadata.dispatch.length > 0) {
        lines.push(`    Dispatch: ${handler.metadata.dispatch.join(', ')}`);
      }
    }
    return lines;
  }

  public generateWorkflowRoadmap(): string {
    const lines: string[] = ['Workflow Roadmap:'];
    this.events_handlers.forEach((handlers, eventName) => {
      lines.push(`Event: ${eventName}`);
      handlers.forEach((handler, index) => {
        lines.push(...this.generateHandlerDescription(handler, index + 1));
      });
    });
    return lines.join('\n');
  }
}

export const eventManager = new EventManager();
