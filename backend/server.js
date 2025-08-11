import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();

// CORS для локального фронтенда
app.use(cors({
  origin: ['http://localhost:5173'], // Добавь URL фронтенда, если он на другом домене
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Дополнительная защита CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  console.log(`[Request] ${req.method} ${req.url} Headers:`, {
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    body: req.body,
  });
  next();
});

// Middleware для обработки JSON
app.use(express.json({ type: 'application/json; charset=utf-8', limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Отключение кэширования
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Маппинг городов
const cityToDestId = {
  'Катон Карагай': '-2140479',
  'Алматы': '-2140479',
  'Кольсай': '-2140479',
  'Астана': '-2141966',
  'Боровое': '-2141966',
  'Кольсайские озера': '-2140479', // Fallback на Алматы
};

const cityToIata = {
  'Катон Карагай': 'ALA',
  'Алматы': 'ALA',
  'Кольсай': 'ALA',
  'Астана': 'TSE',
  'Боровое': 'KOV',
  'Кольсайские озера': 'ALA',
};

// --- OpenAI ---
app.post('/api/ai', async (req, res) => {
  if (!req.body) {
    console.warn('[OpenAI] req.body is undefined. Headers:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    });
    return res.status(400).json({ error: 'Тело запроса отсутствует', details: 'Проверьте Content-Type: application/json и тело запроса' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    console.warn('[OpenAI] Не указан prompt в req.body:', req.body);
    return res.status(400).json({ error: 'Не указан prompt', details: 'req.body должно содержать поле prompt' });
  }

  try {
    console.log('[OpenAI] Запрос с prompt:', prompt);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Сгенерируйте список туров в формате JSON (массив объектов) на основе следующих предпочтений: ${prompt}. Каждый тур должен содержать поля: title (строка), description (строка), price (строка, в тенге KZT), location (строка). Пример: [{"title": "Тур в Кольсай", "description": "2 дня...", "price": "150000 KZT", "location": "Кольсайские озера, Казахстан"}]`
        }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[OpenAI] Ответ от API:', JSON.stringify(response.data, null, 2));
    let tours;
    try {
      tours = JSON.parse(response.data.choices[0].message.content);
      if (!Array.isArray(tours)) {
        tours = [tours];
      }
    } catch (parseError) {
      console.error('[OpenAI] Ошибка парсинга ответа:', parseError);
      tours = [];
    }

    res.json({ tour: tours });
  } catch (error) {
    console.error('[OpenAI] Ошибка:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Недействительный OpenAI API ключ', details: 'Проверьте OPENAI_API_KEY в .env' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Превышен лимит запросов к OpenAI', details: 'Попробуйте позже' });
    }
    res.status(500).json({ error: 'Ошибка OpenAI API', details: error.response?.data || error.message });
  }
});

// --- Aviasales API ---
app.get('/api/flights', async (req, res) => {
  const { origin, destination, departure_at, return_at, cy = 'kzt' } = req.query;
  const destIata = cityToIata[destination] || 'ALA';
  if (!origin || !destIata || !departure_at) {
    console.warn('[Aviasales] Недостаточно параметров:', { origin, destination, destIata, departure_at });
    return res.status(400).json({ error: 'Недостаточно параметров: origin, destination, departure_at' });
  }

  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;
  if (!dateRegex.test(departure_at)) {
    console.warn('[Aviasales] Неверный формат departure_at:', departure_at);
    return res.status(400).json({ error: 'Неверный формат departure_at: используйте YYYY-MM или YYYY-MM-DD' });
  }

  try {
    console.log('[Aviasales] Запрос к API:', { origin, destination: destIata, departure_at, return_at, cy });
    const response = await axios.get('https://api.travelpayouts.com/aviasales/v3/prices_for_dates', {
      params: {
        origin,
        destination: destIata,
        departure_at,
        return_at: return_at || '',
        unique: false,
        sorting: 'price',
        direct: false,
        cy,
        limit: 30,
        page: 1,
        token: process.env.AVIASALES_TOKEN,
      },
      headers: { 'Cache-Control': 'no-cache' },
    });

    console.log('[Aviasales] Ответ от API:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('[Aviasales] Ошибка:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      params: { origin, destination: destIata, departure_at },
    });
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Недействительный Aviasales токен', details: 'Проверьте AVIASALES_TOKEN в .env' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Превышен лимит запросов к Aviasales', details: 'Попробуйте позже' });
    }
    res.status(200).json({ data: [], error: error.response?.data?.error || 'Ошибка поиска перелётов' });
  }
});

// --- Booking.com API ---
app.get('/api/hotels', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    console.warn('[Booking API] Не указан город в запросе');
    return res.status(400).json({ error: 'Не указан город' });
  }

  try {
    let destId = cityToDestId[city];
    if (!destId) {
      console.log(`[Booking API] Запрос /hotels/locations для города: ${city}`);
      const locationResponse = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/hotels/locations', {
        params: { name: city, locale: 'en-us' },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        },
      });

      console.log(`[Booking API] Ответ от /hotels/locations для ${city}:`, JSON.stringify(locationResponse.data, null, 2));
      destId = locationResponse.data[0]?.dest_id;
    }

    if (!destId) {
      console.warn(`[Booking API] Локация "${city}" не найдена, используем fallback на "Almaty"`);
      destId = cityToDestId['Алматы'];
    }

    console.log(`[Booking API] Запрос /hotels/searchHotels для ${city} (dest_id: ${destId})`);
    const hotelsResponse = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels', {
      params: {
        dest_id: destId,
        search_type: 'CITY',
        adults: '3', // Для 3 человек
        room_qty: '2',
        page_number: '1',
        units: 'metric',
        temperature_unit: 'c',
        languagecode: 'en-us',
        currency_code: 'KZT',
        arrival_date: '2025-09-15',
        departure_date: '2025-09-17', // Для 2 дней
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST,
      },
    });

    console.log(`[Booking API] Ответ от /hotels/searchHotels для ${city}:`, JSON.stringify(hotelsResponse.data, null, 2));

    const hotels = hotelsResponse.data.data?.hotels?.map(hotel => ({
      name: hotel.property?.name,
      price: hotel.property?.priceBreakdown?.grossPrice?.value || 'N/A',
      rating: hotel.property?.reviewScore || 'N/A',
      photo: hotel.property?.photoUrls?.[0] || '',
      link: hotel.property?.url || '#',
      hotel_id: hotel.property?.id || null,
    })) || [];

    res.json(hotels);
  } catch (error) {
    console.error('[Booking API] Ошибка:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      city,
    });
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Недействительный RapidAPI ключ', details: 'Проверьте RAPIDAPI_KEY и RAPIDAPI_HOST в .env' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Превышен лимит запросов к RapidAPI', details: 'Попробуйте позже или обновите ключ' });
    }
    res.status(200).json([]);
  }
});

// --- Яндекс.Такси ---
app.get('/api/taxi', async (req, res) => {
  const { lat_from, lon_from, lat_to, lon_to } = req.query;

  if (!lat_from || !lon_from || !lat_to || !lon_to) {
    console.warn('[Yandex Taxi] Не указаны координаты:', { lat_from, lon_from, lat_to, lon_to });
    return res.status(400).json({ error: 'Укажите координаты отправления и назначения' });
  }

  const link = `https://3.redirect.appmetrica.yandex.com/route?start-lat=${lat_from}&start-lon=${lon_from}&end-lat=${lat_to}&end-lon=${lon_to}&ref=appmetrica&appmetrica_tracking_id=1178268795219780156`;
  console.log('[Yandex Taxi] Сгенерирована ссылка:', link);

  res.json({ taxi_link: link });
});

// Обработка ошибок парсинга JSON
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('[Express] Ошибка парсинга JSON:', error.message);
    return res.status(400).json({ error: 'Неверный формат JSON', details: error.message });
  }
  next();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Сервер запущен на порту ${PORT}`));
