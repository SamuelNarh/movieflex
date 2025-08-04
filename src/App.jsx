import React, { useState, useEffect } from 'react'
import { Search } from './components/Search'
import { Loader } from './components/Loader';
import { MovieCard } from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessasage, seterrorMessasage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');
  const [trendingMovies, settrendingMovies] = useState([]);

  // Debounce the search request to prevent making too many API request
  useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setisLoading(true)
    seterrorMessasage('')
    try {
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS)
      if (!response.ok) {
        throw new Error("Failed to fetch Movies");
      }
      const data = await response.json()
      if (data.Response === 'False') {
        seterrorMessasage(data.Error || 'failed to fetch movies !!!')
        setMovieList([])
        return;
      }
      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    }
    catch (error) {
      console.error(`Error fetching movies: ${error}`);
      seterrorMessasage(`Error fetching Movies. Plesae try again later`);
    }
    finally {
      setisLoading(false);
    }
  };

  const LoadTrendingMovies = async () => {

    try {

      const movies = await getTrendingMovies();
      settrendingMovies(movies)
      console.log(movies)
    } catch (error) {
      console.error(`Error fetching Trending Movies: ${error}`);
    }
  }


  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  },
    [debouncedSearchTerm])

  useEffect(() => {
    LoadTrendingMovies()
  }, [])


  return (
    <main>
      <div className='pattern' />

      <div className='wrapper'>
        <header>
          <img src='./hero.png' />
          <h1>Find <span className='text-gradient' >Movies</span>You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {
          trendingMovies.length > 0 &&(
            <section className='trending'>
              <h2>
                Trending Movies
              </h2>
              <ul>
                {
                  trendingMovies.map((trending, index)=>(
                    <li key={trending.$id}>
                      <p>{index+1}</p>
                      <img src={trending.poster_url} alt={trending.title} />
                    </li>
                  ))
                }
              </ul>

            </section>
          )
        }
        <section className='all-movies'>
          <h2>All Movies</h2>
          {
            isLoading ? (<Loader />) : errorMessasage ? (<p className='text-red-500'>{errorMessasage}</p>) :
              (
                <ul>
                  {movieList.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))
                  }
                </ul>
              )
          }
          {errorMessasage && <p className='text-red-500'>{errorMessasage}</p>}

        </section>
      </div>
    </main>
  )
}
