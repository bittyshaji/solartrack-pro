# Custom Hooks Usage Guide

Comprehensive guide for using custom reusable hooks in SolarTrack Pro.

## Table of Contents

1. [useAsync](#useasync) - Handle async operations
2. [useForm](#useform) - Manage form state
3. [usePagination](#usepagination) - Handle pagination
4. [useDebounce](#usedebounce) - Debounce values
5. [useLocalStorage](#uselocalstorage) - Manage local storage
6. [Best Practices](#best-practices)
7. [Real-World Examples](#real-world-examples)

## useAsync

Handles async operations with automatic loading, error, and data states.

### Basic Usage

```javascript
import { useAsync } from '../hooks/useAsync';

function FetchProjects() {
  const { data, loading, error } = useAsync(() => api.getProjects());

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Projects: {data?.length}</div>;
}
```

### API Reference

```javascript
const {
  data,           // Result from async function
  loading,        // True while executing
  error,          // Error if failed
  execute,        // Manual trigger function
  reset,          // Reset to initial state
} = useAsync(
  asyncFunction,  // Function to execute
  immediate,      // Auto-execute on mount (default: true)
  dependencies    // Dependencies array for re-execution
);
```

### Advanced Examples

#### Manual Execution

```javascript
function SearchForm() {
  const { data, loading, execute } = useAsync(
    (query) => api.searchProjects(query),
    false // Don't execute immediately
  );

  const handleSearch = (query) => {
    execute(query);
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {loading && <Spinner />}
      {data && <Results items={data} />}
    </div>
  );
}
```

#### With Dependencies

```javascript
function ProjectDetails({ projectId }) {
  const { data: project } = useAsync(
    () => api.getProject(projectId),
    true,
    [projectId] // Re-fetch when projectId changes
  );

  return <div>{project?.name}</div>;
}
```

#### Error Handling

```javascript
function DataTable() {
  const { data, error, reset } = useAsync(() => api.getData());

  if (error) {
    return (
      <div>
        <p>Failed to load data: {error.message}</p>
        <button onClick={reset}>Retry</button>
      </div>
    );
  }

  return <Table data={data} />;
}
```

### Tips

- Always check `loading` state before accessing `data`
- Use `execute` for user-triggered async actions
- Reset on error to allow retry
- Avoid circular dependencies in the dependencies array

## useForm

Manages form state, validation, and submission.

### Basic Usage

```javascript
import { useForm } from '../hooks/useForm';

function LoginForm() {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    { email: '', password: '' },
    {
      onSubmit: async (values) => {
        await api.login(values);
      },
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.email && errors.email && <span>{errors.email}</span>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.password && errors.password && <span>{errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### API Reference

```javascript
const {
  values,         // Current form values
  errors,         // Validation errors
  touched,        // Fields the user has touched
  isSubmitting,   // True while submitting
  handleChange,   // onChange handler
  handleBlur,     // onBlur handler
  setValues,      // Update form values
  setErrors,      // Set validation errors
  reset,          // Reset to initial state
  handleSubmit,   // Form submission handler
  getFieldProps,  // Get props for a field
} = useForm(initialValues, options);
```

### Advanced Examples

#### With Validation

```javascript
function ProfileForm() {
  const { values, errors, touched, handleChange, handleSubmit, setErrors } = useForm(
    { name: '', email: '', age: '' },
    {
      onSubmit: (values) => {
        // Validate
        const newErrors = {};
        if (!values.name) newErrors.name = 'Name is required';
        if (!values.email) newErrors.email = 'Email is required';
        if (values.age < 18) newErrors.age = 'Must be 18+';

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }

        // Submit
        api.updateProfile(values);
      },
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        {...getFieldProps('name')}
      />
      {/* Error displayed automatically by getFieldProps */}
    </form>
  );
}
```

#### Dynamic Field Updates

```javascript
function ProjectForm() {
  const { values, setValues, handleChange } = useForm(
    { name: '', budget: 0, team: [] },
    { onSubmit: (v) => api.createProject(v) }
  );

  const addTeamMember = (member) => {
    setValues((prev) => ({
      ...prev,
      team: [...prev.team, member],
    }));
  };

  return (
    // Form JSX
  );
}
```

#### Reusable Field Component

```javascript
function FormField({ name, label, type = 'text', ...props }) {
  const { values, touched, errors, handleChange, handleBlur } = props.form;

  return (
    <div>
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={values[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
      {touched[name] && errors[name] && <span className="error">{errors[name]}</span>}
    </div>
  );
}
```

### Tips

- Call `setErrors` in `onSubmit` for manual validation
- Use `getFieldProps` to reduce boilerplate
- `touched` prevents showing errors before user interaction
- `isSubmitting` can disable form while submitting
- Reset form after successful submission

## usePagination

Handles pagination logic for data display.

### Basic Usage

```javascript
import { usePagination } from '../hooks/usePagination';

function ProjectsList({ projects }) {
  const { currentPage, getCurrentPageData, nextPage, prevPage, hasNextPage, hasPrevPage } =
    usePagination(projects, 10); // 10 items per page

  const pageData = getCurrentPageData();

  return (
    <div>
      <ul>
        {pageData.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>

      <div className="pagination">
        <button onClick={prevPage} disabled={!hasPrevPage}>
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}
```

### API Reference

```javascript
const {
  currentPage,     // Current page (1-indexed)
  pageSize,        // Items per page
  totalItems,      // Total number of items
  totalPages,      // Total number of pages
  getCurrentPageData, // Get data for current page
  nextPage,        // Go to next page
  prevPage,        // Go to previous page
  goToPage,        // Jump to specific page
  hasNextPage,     // True if next page exists
  hasPrevPage,     // True if previous page exists
  getPageNumbers,  // Get array of page numbers
  reset,           // Reset to page 1
} = usePagination(data, pageSize);
```

### Advanced Examples

#### Page Number Display

```javascript
function Pagination({ pagination }) {
  const { currentPage, getPageNumbers, goToPage, hasNextPage, hasPrevPage } = pagination;
  const pageNumbers = getPageNumbers(2); // Show 2 pages on each side of current

  return (
    <div>
      <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
        First
      </button>

      {pageNumbers.map((num) => (
        <button
          key={num}
          onClick={() => goToPage(num)}
          className={num === currentPage ? 'active' : ''}
        >
          {num}
        </button>
      ))}

      <button onClick={() => goToPage(totalPages)} disabled={!hasNextPage}>
        Last
      </button>
    </div>
  );
}
```

#### Server-Side Pagination

```javascript
function ProjectsTable() {
  const [projects, setProjects] = useState([]);
  const { currentPage, pageSize, goToPage } = usePagination([], 20);

  const { data } = useAsync(
    () => api.getProjects({ page: currentPage, limit: pageSize }),
    true,
    [currentPage, pageSize]
  );

  useEffect(() => {
    if (data) setProjects(data);
  }, [data]);

  return <Table data={projects} />;
}
```

#### URL Synchronization

```javascript
function SearchResults() {
  const { searchTerm } = useParams();
  const [results, setResults] = useState([]);
  const { currentPage, goToPage } = usePagination(results, 15);

  useEffect(() => {
    api.search(searchTerm, currentPage).then(setResults);
  }, [searchTerm, currentPage]);

  return (
    <div>
      <Results data={results} />
      <Pagination
        onPageChange={goToPage}
        currentPage={currentPage}
      />
    </div>
  );
}
```

### Tips

- Use `hasNextPage` and `hasPrevPage` to disable buttons
- `getPageNumbers` is useful for showing page navigation
- Integrate with `useAsync` for server-side pagination
- Remember pagination resets when data changes

## useDebounce

Delays value updates until activity stops.

### Basic Usage

```javascript
import { useDebounce } from '../hooks/useDebounce';

function SearchProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 300); // 300ms delay

  const { data: results } = useAsync(
    () => api.searchProjects(debouncedTerm),
    false
  );

  useEffect(() => {
    if (debouncedTerm) {
      // This effect only runs after user stops typing for 300ms
    }
  }, [debouncedTerm]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search projects..."
      />
      {results && <Results items={results} />}
    </div>
  );
}
```

### API Reference

```javascript
// Basic debounce
const debouncedValue = useDebounce(
  value,          // Value to debounce
  delay           // Delay in milliseconds (default: 500)
);

// With status tracking
const { debouncedValue, trigger, isRunning } = useDebounceFn(value, delay);
```

### Advanced Examples

#### Auto-save with Debounce

```javascript
function Editor({ docId }) {
  const [content, setContent] = useState('');
  const debouncedContent = useDebounce(content, 2000); // Auto-save after 2 seconds

  useEffect(() => {
    api.saveDocument(docId, debouncedContent);
  }, [debouncedContent, docId]);

  return <textarea value={content} onChange={(e) => setContent(e.target.value)} />;
}
```

#### Search with Loading State

```javascript
function SmartSearch() {
  const [query, setQuery] = useState('');
  const { debouncedValue: debouncedQuery, isRunning } = useDebounceFn(query, 300);

  const { data: results, loading } = useAsync(
    () => api.search(debouncedQuery),
    false
  );

  useEffect(() => {
    if (debouncedQuery && !isRunning) {
      // Trigger search
    }
  }, [debouncedQuery, isRunning]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {isRunning && <span>Waiting...</span>}
      {loading && <Spinner />}
      {results && <Results items={results} />}
    </div>
  );
}
```

#### Form Validation with Debounce

```javascript
function EmailField() {
  const [email, setEmail] = useState('');
  const debouncedEmail = useDebounce(email, 500);
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    api.validateEmail(debouncedEmail).then(setIsValid);
  }, [debouncedEmail]);

  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      {isValid === true && <span className="valid">Valid email</span>}
      {isValid === false && <span className="invalid">Invalid email</span>}
    </div>
  );
}
```

### Tips

- Use shorter delays (300-500ms) for search
- Use longer delays (1000-2000ms) for auto-save
- Combine with async operations for best UX
- Always check if debounced value exists before using

## useLocalStorage

Manages localStorage with React state synchronization.

### Basic Usage

```javascript
import { useLocalStorage } from '../hooks/useLocalStorage';

function ThemeSwitcher() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
    </div>
  );
}
```

### API Reference

```javascript
const [
  storedValue,    // Current value from localStorage
  setValue,       // Update localStorage and state
  removeValue,    // Remove from localStorage
] = useLocalStorage(
  key,            // localStorage key
  initialValue    // Default value if key doesn't exist
);
```

### Advanced Examples

#### Complex Objects

```javascript
function UserPreferences() {
  const [preferences, setPreferences] = useLocalStorage('userPrefs', {
    theme: 'light',
    language: 'en',
    notifications: true,
  });

  const updateTheme = (newTheme) => {
    setPreferences((prev) => ({
      ...prev,
      theme: newTheme,
    }));
  };

  return (
    <div>
      <p>Theme: {preferences.theme}</p>
      <button onClick={() => updateTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

#### Session Storage

```javascript
import { useSessionStorage } from '../hooks/useLocalStorage';

function FormDraft() {
  const [draft, setDraft, removeDraft] = useSessionStorage('formDraft', {});

  const saveDraft = (formData) => {
    setDraft(formData);
  };

  const discardDraft = () => {
    removeDraft();
  };

  return (
    <div>
      <button onClick={() => saveDraft(formData)}>Save Draft</button>
      <button onClick={discardDraft}>Discard</button>
    </div>
  );
}
```

#### Sync Across Tabs

```javascript
function StoreSelector() {
  const [selectedStore, setSelectedStore] = useLocalStorage('selectedStore', null);

  // Auto-updates when changed in another tab
  return <p>Selected Store: {selectedStore}</p>;
}
```

### Tips

- Use for user preferences (theme, language, etc.)
- Use for form drafts and temporary data
- Always provide a meaningful initial value
- Be mindful of storage space (~5MB limit)
- Clear old data periodically to avoid buildup

## Best Practices

### 1. Combine Hooks for Power

```javascript
function SmartSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [history, setHistory] = useLocalStorage('searchHistory', []);

  const { data: results, loading } = useAsync(
    () => api.search(debouncedQuery),
    false
  );

  const handleSearch = () => {
    setHistory((prev) => [...new Set([debouncedQuery, ...prev])].slice(0, 10));
  };

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch();
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading && <Spinner />}
      {results && <Results items={results} />}
      <History items={history} />
    </div>
  );
}
```

### 2. Error Handling

```javascript
function DataFetcher() {
  const { data, error, loading, execute } = useAsync(fetchData, false);

  const handleRetry = async () => {
    try {
      await execute();
    } catch (err) {
      logger.error('Failed to fetch:', err);
    }
  };

  if (error)
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  if (loading) return <Skeleton />;
  return <Content data={data} />;
}
```

### 3. Performance Optimization

```javascript
function OptimizedList({ items }) {
  const { currentPage, getCurrentPageData } = usePagination(items, 50);
  const pageData = useMemo(() => getCurrentPageData(), [currentPage, items]);

  return <VirtualizedList items={pageData} />;
}
```

## Real-World Examples

### Complete Project Dashboard

```javascript
function ProjectDashboard() {
  // Fetch projects with async hook
  const { data: projects, loading } = useAsync(() => api.getProjects());

  // Manage filter form
  const { values, handleChange } = useForm({ status: 'all', team: '' });

  // Pagination
  const filteredProjects = useMemo(
    () => projects?.filter((p) => p.status === values.status) || [],
    [projects, values.status]
  );

  const { currentPage, getCurrentPageData, nextPage, prevPage } = usePagination(
    filteredProjects,
    10
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <FilterForm form={values} onChange={handleChange} />
      <ProjectsTable data={getCurrentPageData()} />
      <Pagination onNext={nextPage} onPrev={prevPage} />
    </div>
  );
}
```

See [QUICK_WINS_SETUP_GUIDE.md](./QUICK_WINS_SETUP_GUIDE.md) for more examples and setup instructions.
