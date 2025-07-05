# Why I Choose Mapbox GL JS for the Hotel Discovery Map

## My Decision Process

As someone approaching this project with **5 days and Cursor AI assistance**, I need to balance **technical sophistication** with **implementation speed**. After analyzing the evaluation criteria, I'm confident that **Mapbox GL JS** is the optimal choice.

## Technical Rationale

### 1. Clustering Implementation (Critical for Success)

The spec explicitly requires **visual clustering** - this is where most candidates will struggle. Here's why Mapbox excels:

```typescript
// Mapbox makes clustering trivial with built-in support
map.addSource('hotels', {
  type: 'geojson',
  data: hotelData,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});
```

With **Google Maps**, I'd need to implement clustering from scratch or integrate third-party libraries like `@googlemaps/markerclusterer`. With **Leaflet**, I'd use `Leaflet.markercluster` but face styling limitations.

### 2. Performance & User Experience (40% of evaluation)

- **Vector tiles**: Mapbox renders at 60fps even with hundreds of markers
- **Smooth zoom transitions**: Critical for the "intuitive and responsive" requirement
- **WebGL rendering**: Superior performance compared to DOM-based solutions

### 3. AI Tool Leverage (30% of evaluation)

Mapbox's comprehensive documentation and examples make it **AI-friendly**:
- Cursor can generate working Mapbox code more reliably
- Extensive TypeScript support reduces debugging time
- Rich ecosystem of React components (`react-map-gl`)

## Implementation Strategy

### Day 1-2: Core Setup
```typescript
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const HotelMap: React.FC = () => {
  return (
    <Map
      mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      initialViewState={{
        longitude: -122.3328,
        latitude: 47.6061,
        zoom: 12
      }}
      style={{ width: '100%', height: '100vh' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      <Source id="hotels" type="geojson" data={hotelData} cluster={true}>
        <Layer {...clusterLayer} />
        <Layer {...unclusteredPointLayer} />
      </Source>
    </Map>
  );
};
```

### Day 3-4: Advanced Features
- Custom cluster styling with price ranges
- Popup implementation with hotel details
- Responsive design and mobile optimization

### Day 5: Polish & Deploy
- Vercel deployment (free tier)
- Performance optimization
- Final testing

## Why Not the Alternatives?

### Google Maps
- **Pros**: Familiar UI, extensive documentation
- **Cons**: Complex clustering setup, higher learning curve, potential quota issues
- **Risk**: More time debugging, less time for polish

### Leaflet
- **Pros**: Lightweight, open-source
- **Cons**: Limited clustering animations, more manual configuration
- **Risk**: Styling limitations affect user experience score

## Competitive Advantage

By choosing Mapbox, I'm demonstrating:
1. **Technical judgment**: Selecting the right tool for clustering requirements
2. **Industry awareness**: Using the same technology as Uber, Airbnb, and major mapping applications
3. **Scalability thinking**: The spec mentions "powerful and future-expandable" - Mapbox excels here

## Expected Outcome

With Mapbox + Cursor AI, I can deliver:
- ✅ **Smooth clustering behavior** (Implementation Quality: 20%)
- ✅ **Intuitive map interactions** (User Experience: 40%) 
- ✅ **Professional-grade visuals** (Deployment & Polish: 10%)
- ✅ **Efficient development process** (AI Tool Utilization: 30%)

The **free tier** provides 50,000 map loads/month - more than sufficient for this project's scope.

---

*This choice maximizes my chances of delivering a polished, professional application that stands out in the evaluation process.*