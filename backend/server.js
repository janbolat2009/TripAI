import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- OpenAI (gpt-3.5-turbo) ---
app.post('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Не указан prompt' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Сгенерируйте список туров в формате JSON (массив объектов) на основе следующих предпочтений: ${prompt}. Каждый тур должен содержать поля: title (строка), description (строка), price (строка), location (строка). Пример: [{"title": "Тур в Алматы", "description": "7 дней...", "price": "800 EUR", "location": "Алматы, Казахстан"}]`
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
    console.error('[OpenAI] Ошибка:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка OpenAI API', details: error.response?.data || error.message });
  }
});

// --- Aviasales API ---
app.get('/api/flights', async (req, res) => {
  const { origin, destination, departure_at, return_at } = req.query;
  if (!origin || !destination || !departure_at) {
    console.warn('[Aviasales] Недостаточно параметров:', { origin, destination, departure_at });
    return res.status(400).json({ error: 'Недостаточно параметров для поиска перелётов' });
  }

  try {
    console.log('[Aviasales] Запрос к API:', { origin, destination, departure_at, return_at });
    const response = await axios.get('https://api.travelpayouts.com/aviasales/v3/prices_for_dates', {
      params: {
        origin,
        destination,
        departure_at,
        return_at,
        unique: false,
        sorting: 'price',
        direct: false,
        cy: 'usd',
        limit: 30,
        page: 1,
        token: process.env.AVIASALES_TOKEN,
      },
    });

    console.log('[Aviasales] Ответ от API:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('[Aviasales] Ошибка:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      params: { origin, destination, departure_at },
    });
    res.status(200).json({ data: [], error: error.response?.data?.error || 'Ошибка поиска перелётов' });
  }
});

// --- Booking.com Demand API ---
app.get('/api/hotels', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    console.warn('[Booking API] Не указан город в запросе');
    return res.status(400).json({ error: 'Не указан город' });
  }

  try {
    console.log(`[Booking API] Запрос /common/locations/cities для города: ${city}`);
    const locationResponse = await axios.post(
      'https://demandapi.booking.com/3.1/common/locations/cities',
      { name: city },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN}`,
          'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Booking API] Ответ от /common/locations/cities для ${city}:`, JSON.stringify(locationResponse.data, null, 2));

    const cityId = locationResponse.data?.data?.[0]?.city;
    if (!cityId) {
      console.warn(`[Booking API] Город "${city}" не найден, пробуем fallback на "Almaty"`);
      const fallbackResponse = await axios.post(
        'https://demandapi.booking.com/3.1/common/locations/cities',
        { name: 'Almaty' },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN}`,
            'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[Booking API] Ответ от /common/locations/cities для Almaty (fallback):`, JSON.stringify(fallbackResponse.data, null, 2));

      const fallbackCityId = fallbackResponse.data?.data?.[0]?.city;
      if (!fallbackCityId) {
        console.error(`[Booking API] Fallback "Almaty" не найден`);
        return res.status(200).json([]);
      }

      console.log(`[Booking API] Запрос /accommodations/search для Almaty (city: ${fallbackCityId})`);
      const hotelsResponse = await axios.post(
        'https://demandapi.booking.com/3.1/accommodations/search',
        {
          booker: { country: 'kz', platform: 'desktop' },
          checkin: '2025-09-15',
          checkout: '2025-09-18',
          city: fallbackCityId,
          guests: { number_of_adults: 5, number_of_rooms: 2 },
          currency: 'USD',
          extras: ['extra_charges', 'products'],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN}`,
            'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[Booking API] Ответ от /accommodations/search для Almaty:`, JSON.stringify(hotelsResponse.data, null, 2));

      const hotels = hotelsResponse.data.data?.map(hotel => ({
        name: hotel.name || hotel.id.toString(),
        price: hotel.price?.total ? `${hotel.price.total} ${hotel.currency}` : 'N/A',
        rating: hotel.review_score || 'N/A',
        photo: hotel.photos?.[0]?.url || '',
        link: hotel.deep_link_url || '#',
        hotel_id: hotel.id || null,
      })) || [];

      return res.json(hotels);
    }

    console.log(`[Booking API] Запрос /accommodations/search для ${city} (city: ${cityId})`);
    const hotelsResponse = await axios.post(
      'https://demandapi.booking.com/3.1/accommodations/search',
      {
        booker: { country: 'kz', platform: 'desktop' },
        checkin: '2025-09-15',
        checkout: '2025-09-18',
        city: cityId,
        guests: { number_of_adults: 5, number_of_rooms: 2 },
        currency: 'USD',
        extras: ['extra_charges', 'products'],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN}`,
          'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Booking API] Ответ от /accommodations/search для ${city}:`, JSON.stringify(hotelsResponse.data, null, 2));

    const hotels = hotelsResponse.data.data?.map(hotel => ({
      name: hotel.name || hotel.id.toString(),
      price: hotel.price?.total ? `${hotel.price.total} ${hotel.currency}` : 'N/A',
      rating: hotel.review_score || 'N/A',
      photo: hotel.photos?.[0]?.url || '',
      link: hotel.deep_link_url || '#',
      hotel_id: hotel.id || null,
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
      return res.status(401).json({ error: 'Недействительный Bearer Token или Affiliate ID', details: 'Проверьте BOOKING_BEARER_TOKEN и BOOKING_AFFILIATE_ID в .env' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Превышен лимит запросов к Booking API', details: 'Попробуйте позже или проверьте лимиты' });
    }
    return res.status(200).json([]);
  }
});

// --- Test Endpoint ---
app.get('/api/test', async (req, res) => {
  try {
    console.log('[Booking API] Запрос /common/locations/cities для проверки Bearer Token');
    const response = await axios.post(
      'https://demandapi.booking.com/3.1/common/locations/cities',
      { name: 'Almaty' },
      {
        headers: {
          Authorization: `Bearer ${process.env.BOOKING_BEARER_TOKEN}`,
          'X-Affiliate-Id': process.env.BOOKING_AFFILIATE_ID,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[Booking API] Ответ от /common/locations/cities:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('[Booking API] Ошибка тест API:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(error.response?.status || 500).json({
      error: 'Ошибка тест API',
      details: error.response?.data?.message || error.message,
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));