import { Pipe, PipeTransform } from '@angular/core';
import jalaliMoment from 'jalali-moment';

@Pipe({
  name: 'localDate',
  standalone: true
})
export class LocalDatePipe implements PipeTransform {
  private persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  transform(value: string | Date | undefined, format: string = 'jYYYY-jMM-jDD dddd HH:mm'): string {
    if (!value) return 'تاریخ ثبت نشده'; // مدیریت undefined یا null
    const date = new Date(value);
    // تنظیم منطقه زمانی تهران (UTC+03:30)
    const tehranOffset = 3.5 * 60; // 3.5 ساعت به دقیقه
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