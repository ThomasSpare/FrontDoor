import React from 'react';
import './Banner.css'; // Make sure to create this CSS file for styling

const Banner = ({ headline, backgroundImage, backgroundVideo }) => {
    return (
        <div className="banner-container">
            <img className="banner-image" src={backgroundImage} alt="Big John" />
            <video className="banner-video" autoPlay loop muted playsInline>
                <source src={backgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="banner-content">
                <h1>{headline}</h1>
                <img 
                    className='logo' 
                    src={'https://res.cloudinary.com/djunroohl/image/upload/v1728499829/watermark_transparency_logo_ofihyb.png'} 
                    alt="Big John Logo" 
                />
            </div>
        </div>
    );
}
export default Banner;