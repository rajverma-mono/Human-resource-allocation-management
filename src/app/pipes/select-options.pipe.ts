import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'selectOptions',
  standalone: true
})
export class SelectOptionsPipe implements PipeTransform {
  transform(options: any[]): any[] {
    if (!options) return [];
    return options.map(o => typeof o === 'string' ? { label:o, value:o } : o);
  }
}
