import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Sun,
  Home,
  Zap,
  Wrench,
  Edit2,
  Save,
  X,
  Loader,
  AlertCircle,
  CheckCircle,
  Camera,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSiteSurvey,
  createSiteSurvey,
  updateSiteSurvey,
  deleteSiteSurvey,
  ROOF_TYPES,
  ROOF_ORIENTATIONS,
  STRUCTURAL_ASSESSMENTS
} from '../lib/siteSurveyService';

const SiteSurveyPanel = ({ projectId }) => {
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [formData, setFormData] = useState({
    survey_date: '',
    surveyor_name: '',
    roof_area_sqft: '',
    roof_type: '',
    roof_orientation: '',
    roof_pitch_degrees: '',
    shading_percentage: 0,
    available_area_sqft: '',
    elevation_meters: '',
    gps_latitude: '',
    gps_longitude: '',
    soil_condition: '',
    weather_conditions: '',
    existing_electrical_capacity: '',
    grid_connection_type: '',
    structural_assessment: 'pending',
    access_conditions: '',
    nearby_obstacles: '',
    recommended_capacity_kw: '',
    recommended_panel_count: '',
    recommended_inverter_type: '',
    site_photos_urls: [],
    site_sketch_url: '',
    notes: ''
  });

  // Load survey on component mount or when projectId changes
  useEffect(() => {
    loadSurvey();
  }, [projectId]);

  const loadSurvey = async () => {
    setIsLoading(true);
    try {
      const { success, data, error } = await getSiteSurvey(projectId);

      if (!success) {
        console.error('Failed to load survey:', error);
        toast.error('Failed to load site survey');
        setIsLoading(false);
        return;
      }

      if (data) {
        setSurvey(data);
        setFormData(data);
      } else {
        setSurvey(null);
        // Reset form to empty state
        setFormData({
          survey_date: '',
          surveyor_name: '',
          roof_area_sqft: '',
          roof_type: '',
          roof_orientation: '',
          roof_pitch_degrees: '',
          shading_percentage: 0,
          available_area_sqft: '',
          elevation_meters: '',
          gps_latitude: '',
          gps_longitude: '',
          soil_condition: '',
          weather_conditions: '',
          existing_electrical_capacity: '',
          grid_connection_type: '',
          structural_assessment: 'pending',
          access_conditions: '',
          nearby_obstacles: '',
          recommended_capacity_kw: '',
          recommended_panel_count: '',
          recommended_inverter_type: '',
          site_photos_urls: [],
          site_sketch_url: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error('Error loading survey:', err);
      toast.error('Error loading site survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleArrayInputChange = (e, index) => {
    const { value } = e.target;
    const newArray = [...formData.site_photos_urls];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      site_photos_urls: newArray
    }));
  };

  const addPhotoUrl = () => {
    setFormData(prev => ({
      ...prev,
      site_photos_urls: [...prev.site_photos_urls, '']
    }));
  };

  const removePhotoUrl = (index) => {
    setFormData(prev => ({
      ...prev,
      site_photos_urls: prev.site_photos_urls.filter((_, i) => i !== index)
    }));
  };

  const handleUseCurrentLocation = async () => {
    setGeoLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setFormData(prev => ({
        ...prev,
        gps_latitude: position.coords.latitude.toFixed(7),
        gps_longitude: position.coords.longitude.toFixed(7),
        elevation_meters: Math.round(position.coords.altitude || 0)
      }));

      toast.success('Location captured successfully');
    } catch (err) {
      console.error('Geolocation error:', err);
      toast.error('Unable to get current location. Please check permissions.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!formData.surveyor_name || !formData.survey_date) {
        toast.error('Please fill in surveyor name and survey date');
        setIsSaving(false);
        return;
      }

      // Clean up empty photo URLs
      const cleanedData = {
        ...formData,
        site_photos_urls: formData.site_photos_urls.filter(url => url.trim() !== '')
      };

      let result;
      if (survey) {
        // Update existing survey
        result = await updateSiteSurvey(projectId, cleanedData);
      } else {
        // Create new survey
        result = await createSiteSurvey(projectId, cleanedData);
      }

      if (result.success) {
        setSurvey(result.data);
        setIsEditing(false);
        toast.success(survey ? 'Survey updated successfully' : 'Survey created successfully');
      } else {
        toast.error(result.error || 'Failed to save survey');
      }
    } catch (err) {
      console.error('Error saving survey:', err);
      toast.error('Error saving survey');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (survey) {
      setFormData(survey);
    } else {
      setFormData({
        survey_date: '',
        surveyor_name: '',
        roof_area_sqft: '',
        roof_type: '',
        roof_orientation: '',
        roof_pitch_degrees: '',
        shading_percentage: 0,
        available_area_sqft: '',
        elevation_meters: '',
        gps_latitude: '',
        gps_longitude: '',
        soil_condition: '',
        weather_conditions: '',
        existing_electrical_capacity: '',
        grid_connection_type: '',
        structural_assessment: 'pending',
        access_conditions: '',
        nearby_obstacles: '',
        recommended_capacity_kw: '',
        recommended_panel_count: '',
        recommended_inverter_type: '',
        site_photos_urls: [],
        site_sketch_url: '',
        notes: ''
      });
    }
    setIsEditing(false);
  };

  const getStructuralAssessmentColor = (assessment) => {
    const colorMap = {
      suitable: 'bg-green-100 text-green-800 border-green-300',
      needs_reinforcement: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      not_suitable: 'bg-red-100 text-red-800 border-red-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colorMap[assessment] || colorMap.pending;
  };

  const getStructuralAssessmentIcon = (assessment) => {
    const iconMap = {
      suitable: <CheckCircle className="w-4 h-4" />,
      needs_reinforcement: <AlertCircle className="w-4 h-4" />,
      not_suitable: <X className="w-4 h-4" />,
      pending: <Loader className="w-4 h-4" />
    };
    return iconMap[assessment] || iconMap.pending;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // VIEW MODE
  if (!isEditing && survey) {
    return (
      <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              Site Survey
            </h2>
            {survey.survey_date && (
              <p className="text-sm text-gray-500 mt-1">
                Survey Date: {new Date(survey.survey_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit Survey
          </button>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Surveyor Name</label>
            <p className="text-gray-900 mt-1">{survey.surveyor_name || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Survey Date</label>
            <p className="text-gray-900 mt-1">
              {survey.survey_date ? new Date(survey.survey_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        {/* Roof Details */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-orange-500" />
            Roof Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Roof Area (sqft)</label>
              <p className="text-gray-900 mt-1">{survey.roof_area_sqft || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Roof Type</label>
              <p className="text-gray-900 mt-1 capitalize">{survey.roof_type || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Roof Orientation</label>
              <p className="text-gray-900 mt-1 capitalize">{survey.roof_orientation || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Roof Pitch (degrees)</label>
              <p className="text-gray-900 mt-1">{survey.roof_pitch_degrees || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Available Area (sqft)</label>
              <p className="text-gray-900 mt-1">{survey.available_area_sqft || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Shading Percentage</label>
              <p className="text-gray-900 mt-1">{survey.shading_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Site Conditions */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-500" />
            Site Conditions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Elevation (m)</label>
              <p className="text-gray-900 mt-1">{survey.elevation_meters || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Soil Condition</label>
              <p className="text-gray-900 mt-1">{survey.soil_condition || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">GPS Latitude</label>
              <p className="text-gray-900 mt-1 font-mono text-sm">{survey.gps_latitude || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">GPS Longitude</label>
              <p className="text-gray-900 mt-1 font-mono text-sm">{survey.gps_longitude || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-700">Weather Conditions</label>
              <p className="text-gray-900 mt-1">{survey.weather_conditions || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-700">Access Conditions</label>
              <p className="text-gray-900 mt-1">{survey.access_conditions || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-700">Nearby Obstacles</label>
              <p className="text-gray-900 mt-1">{survey.nearby_obstacles || '-'}</p>
            </div>
          </div>
        </div>

        {/* Electrical */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            Electrical
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Grid Connection Type</label>
              <p className="text-gray-900 mt-1">{survey.grid_connection_type || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Existing Capacity</label>
              <p className="text-gray-900 mt-1">{survey.existing_electrical_capacity || '-'}</p>
            </div>
          </div>
        </div>

        {/* Structural Assessment */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-purple-500" />
            Structural Assessment
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStructuralAssessmentColor(survey.structural_assessment)}`}
            >
              {getStructuralAssessmentIcon(survey.structural_assessment)}
              <span className="font-semibold capitalize">{survey.structural_assessment}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Recommendations
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Recommended Capacity (kW)</label>
              <p className="text-gray-900 mt-1">{survey.recommended_capacity_kw || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Recommended Panel Count</label>
              <p className="text-gray-900 mt-1">{survey.recommended_panel_count || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold text-gray-700">Recommended Inverter Type</label>
              <p className="text-gray-900 mt-1">{survey.recommended_inverter_type || '-'}</p>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {survey.site_photos_urls && survey.site_photos_urls.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-blue-500" />
              Site Photos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {survey.site_photos_urls.map((url, idx) => (
                <div key={idx} className="bg-gray-100 p-4 rounded-lg">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all text-sm"
                  >
                    Photo {idx + 1}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site Sketch */}
        {survey.site_sketch_url && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Site Sketch</h3>
            <a href={survey.site_sketch_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View Sketch
            </a>
          </div>
        )}

        {/* Notes */}
        {survey.notes && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{survey.notes}</p>
          </div>
        )}
      </div>
    );
  }

  // EDIT/CREATE MODE
  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-6 h-6 text-blue-600" />
          {survey ? 'Edit Survey' : 'Create Site Survey'}
        </h2>
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Surveyor Name *
            </label>
            <input
              type="text"
              name="surveyor_name"
              value={formData.surveyor_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter surveyor name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Survey Date *
            </label>
            <input
              type="date"
              name="survey_date"
              value={formData.survey_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Roof Details */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-orange-500" />
          Roof Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roof Area (sqft)
            </label>
            <input
              type="number"
              step="0.01"
              name="roof_area_sqft"
              value={formData.roof_area_sqft}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Roof Type</label>
            <select
              name="roof_type"
              value={formData.roof_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select roof type</option>
              {ROOF_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roof Orientation
            </label>
            <select
              name="roof_orientation"
              value={formData.roof_orientation}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select orientation</option>
              {ROOF_ORIENTATIONS.map(orientation => (
                <option key={orientation} value={orientation}>
                  {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Roof Pitch (degrees)
            </label>
            <input
              type="number"
              step="0.1"
              name="roof_pitch_degrees"
              value={formData.roof_pitch_degrees}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Available Area (sqft)
            </label>
            <input
              type="number"
              step="0.01"
              name="available_area_sqft"
              value={formData.available_area_sqft}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shading Percentage (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              name="shading_percentage"
              value={formData.shading_percentage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Site Conditions */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          Site Conditions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Elevation (meters)
            </label>
            <input
              type="number"
              name="elevation_meters"
              value={formData.elevation_meters}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Soil Condition
            </label>
            <input
              type="text"
              name="soil_condition"
              value={formData.soil_condition}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Loamy, Rocky, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GPS Latitude
            </label>
            <input
              type="number"
              step="0.0000001"
              name="gps_latitude"
              value={formData.gps_latitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="e.g., 40.7128"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              GPS Longitude
            </label>
            <input
              type="number"
              step="0.0000001"
              name="gps_longitude"
              value={formData.gps_longitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="e.g., -74.0060"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {geoLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Compass className="w-4 h-4" />
              )}
              Use Current Location
            </button>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Weather Conditions
            </label>
            <input
              type="text"
              name="weather_conditions"
              value={formData.weather_conditions}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Clear, Partly Cloudy, etc."
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Access Conditions
            </label>
            <textarea
              name="access_conditions"
              value={formData.access_conditions}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe access conditions to the roof..."
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nearby Obstacles
            </label>
            <textarea
              name="nearby_obstacles"
              value={formData.nearby_obstacles}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Trees, buildings, power lines, etc."
            />
          </div>
        </div>
      </div>

      {/* Electrical */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Electrical
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grid Connection Type
            </label>
            <input
              type="text"
              name="grid_connection_type"
              value={formData.grid_connection_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Single-phase, Three-phase"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Existing Electrical Capacity
            </label>
            <input
              type="text"
              name="existing_electrical_capacity"
              value={formData.existing_electrical_capacity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 100 A, 200 A"
            />
          </div>
        </div>
      </div>

      {/* Structural Assessment */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-purple-500" />
          Structural Assessment
        </h3>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment</label>
          <select
            name="structural_assessment"
            value={formData.structural_assessment}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STRUCTURAL_ASSESSMENTS.map(assessment => (
              <option key={assessment} value={assessment}>
                {assessment.charAt(0).toUpperCase() + assessment.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Recommendations
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recommended Capacity (kW)
            </label>
            <input
              type="number"
              step="0.1"
              name="recommended_capacity_kw"
              value={formData.recommended_capacity_kw}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recommended Panel Count
            </label>
            <input
              type="number"
              name="recommended_panel_count"
              value={formData.recommended_panel_count}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recommended Inverter Type
            </label>
            <input
              type="text"
              name="recommended_inverter_type"
              value={formData.recommended_inverter_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., String, Microinverter, Hybrid"
            />
          </div>
        </div>
      </div>

      {/* Site Photos */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" />
          Site Photos
        </h3>
        <div className="space-y-3">
          {formData.site_photos_urls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleArrayInputChange(e, idx)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/photo.jpg"
              />
              <button
                onClick={() => removePhotoUrl(idx)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addPhotoUrl}
            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
          >
            + Add Photo URL
          </button>
        </div>
      </div>

      {/* Site Sketch */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Sketch</h3>
        <input
          type="url"
          name="site_sketch_url"
          value={formData.site_sketch_url}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/sketch.pdf"
        />
      </div>

      {/* Notes */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes about the site survey..."
        />
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-4 flex gap-4 justify-end">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSaving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Survey'}
        </button>
      </div>
    </div>
  );
};

export default SiteSurveyPanel;
