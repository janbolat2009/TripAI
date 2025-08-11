require('dotenv').config(); // ✅ ЭТА СТРОКА ОБЯЗАТЕЛЬНА

const axios = require('axios');

// 1. Проверка Booking.com
async function testBooking() {
  try {
    const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
      params: {
        city_name: 'Antalya',
        checkin_date: '2025-04-01',
        checkout_date: '2025-04-05',
        adults_number: '2',
        room_number: '1',
        page_number: '0',
        locale: 'en-gb',
        currency: 'USD',
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'booking-com.p.rapidapi.com',
      },
    });

    console.log('✅ Отели в Анталье:', response.data.result.slice(0, 2).map(h => h.hotel_name));
  } catch (error) {
    console.error('❌ Ошибка Booking.com:', error.response?.data || error.message);
  }
}

// 2. Проверка Яндекс.Геокодер
async function testYandex() {
  try {
    const response = await axios.get('https://geocode-maps.yandex.ru/1.x/', {
      params: {
        apikey: process.env.YANDEX_API_KEY,
        format: 'json',
        geocode: 'Antalya',
      },
    });

    console.log('✅ Геокодер Яндекс:', response.data.response.GeoObjectCollection.featureMember[0]?.GeoObject.name);
  } catch (error) {
    console.error('❌ Ошибка Яндекс:', error.response?.data || error.message);
  }
}

// Запуск тестов
testBooking();
testYandex();