import { Pipe, PipeTransform } from '@angular/core';
import jalaliMoment from 'jalali-moment';

@Pipe({
  name: 'localDate',
  standalone: true
})
export class LocalDatePipe implements PipeTransform {
  private persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  transform(value: string | Date, format: string = 'jYYYY-jMM-jDD HH:mm'): string {
    const date = new Date(value);
    // تهران UTC+04:00 هست
    const tehranOffset = 4 * 60; // 4 ساعت به دقیقه
    const localOffset = date.getTimezoneOffset(); // افست محلی مرورگر
    const adjustedDate = new Date(date.getTime() + (tehranOffset + localOffset) * 60 * 1000);

    const jalaliDate = jalaliMoment(adjustedDate).locale('fa');
    let formattedDate = jalaliDate.format(format);

    // تبدیل اعداد به فارسی
    formattedDate = this.toPersianNumber(formattedDate);

    return formattedDate;
  }

  private toPersianNumber(englishNumber: string): string {
    return englishNumber.replace(/\d/g, (match) => this.persianNumbers[parseInt(match)]);
  }
}