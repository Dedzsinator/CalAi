#!/usr/bin/env python3
"""
CalAi Dataset Downloader
Downloads and prepares datasets for food recognition training.
"""

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any
import requests
import zipfile
import tarfile
import json
from datetime import datetime

# Third-party imports
import kaggle
from huggingface_hub import hf_hub_download, list_repo_files
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dataset_download.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DatasetDownloader:
    """Downloads and prepares datasets for CalAi training."""
    
    def __init__(self, data_dir: str = "./datasets"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Ensure Kaggle credentials are available
        if not os.getenv('KAGGLE_USERNAME') or not os.getenv('KAGGLE_KEY'):
            logger.warning("Kaggle credentials not found. Some datasets may not be available.")
        
        # Dataset configurations
        self.datasets = {
            'food101': {
                'source': 'kaggle',
                'identifier': 'dansbecker/food-101',
                'description': 'Food-101 dataset with 101 food categories',
                'size': '5GB',
                'priority': 1
            },
            'uecfood256': {
                'source': 'huggingface',
                'identifier': 'food101/food101',
                'description': 'UEC Food 256 dataset',
                'size': '2GB',
                'priority': 2
            },
            'nutrition5k': {
                'source': 'direct',
                'url': 'https://github.com/google-research-datasets/Nutrition5k/releases/download/v1.0/nutrition5k_dataset.zip',
                'description': 'Nutrition5k dataset with nutrition labels',
                'size': '1.5GB',
                'priority': 3
            },
            'openfoodfacts': {
                'source': 'api',
                'url': 'https://world.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz',
                'description': 'Open Food Facts database',
                'size': '3GB',
                'priority': 4
            },
            'usda_nutrition': {
                'source': 'api',
                'url': 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2023-04-20.zip',
                'description': 'USDA FoodData Central',
                'size': '500MB',
                'priority': 5
            }
        }
    
    def download_all(self, max_size_gb: float = 10.0) -> None:
        """Download all datasets up to max_size_gb."""
        logger.info(f"Starting dataset downloads (max {max_size_gb}GB)...")
        
        total_size = 0
        downloaded = []
        
        # Sort by priority
        sorted_datasets = sorted(
            self.datasets.items(),
            key=lambda x: x[1]['priority']
        )
        
        for name, config in sorted_datasets:
            size_gb = self._parse_size_gb(config['size'])
            
            if total_size + size_gb > max_size_gb:
                logger.warning(f"Skipping {name} - would exceed size limit")
                continue
            
            try:
                success = self.download_dataset(name)
                if success:
                    downloaded.append(name)
                    total_size += size_gb
                    logger.info(f"Downloaded {name} ({config['size']})")
            except Exception as e:
                logger.error(f"Failed to download {name}: {e}")
        
        logger.info(f"Downloaded {len(downloaded)} datasets: {downloaded}")
        self._create_metadata(downloaded)
    
    def download_dataset(self, name: str) -> bool:
        """Download a specific dataset."""
        if name not in self.datasets:
            logger.error(f"Unknown dataset: {name}")
            return False
        
        config = self.datasets[name]
        dataset_dir = self.data_dir / name
        
        if dataset_dir.exists() and any(dataset_dir.iterdir()):
            logger.info(f"{name} already exists, skipping download")
            return True
        
        dataset_dir.mkdir(exist_ok=True)
        
        logger.info(f"Downloading {name} ({config['description']})...")
        
        try:
            if config['source'] == 'kaggle':
                return self._download_kaggle(name, config, dataset_dir)
            elif config['source'] == 'huggingface':
                return self._download_huggingface(name, config, dataset_dir)
            elif config['source'] == 'direct':
                return self._download_direct(name, config, dataset_dir)
            elif config['source'] == 'api':
                return self._download_api(name, config, dataset_dir)
            else:
                logger.error(f"Unknown source type: {config['source']}")
                return False
        except Exception as e:
            logger.error(f"Error downloading {name}: {e}")
            return False
    
    def _download_kaggle(self, name: str, config: Dict, dataset_dir: Path) -> bool:
        """Download from Kaggle."""
        try:
            kaggle.api.authenticate()
            kaggle.api.dataset_download_files(
                config['identifier'],
                path=str(dataset_dir),
                unzip=True
            )
            return True
        except Exception as e:
            logger.error(f"Kaggle download failed for {name}: {e}")
            return False
    
    def _download_huggingface(self, name: str, config: Dict, dataset_dir: Path) -> bool:
        """Download from Hugging Face."""
        try:
            # List files in the repository
            files = list_repo_files(config['identifier'], repo_type='dataset')
            
            for file_path in files[:10]:  # Limit for demo
                try:
                    local_path = hf_hub_download(
                        repo_id=config['identifier'],
                        filename=file_path,
                        repo_type='dataset',
                        cache_dir=str(dataset_dir)
                    )
                    logger.debug(f"Downloaded {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to download {file_path}: {e}")
            
            return True
        except Exception as e:
            logger.error(f"HuggingFace download failed for {name}: {e}")
            return False
    
    def _download_direct(self, name: str, config: Dict, dataset_dir: Path) -> bool:
        """Download from direct URL."""
        try:
            response = requests.get(config['url'], stream=True)
            response.raise_for_status()
            
            filename = config['url'].split('/')[-1]
            file_path = dataset_dir / filename
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Extract if it's an archive
            if filename.endswith('.zip'):
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(dataset_dir)
                file_path.unlink()  # Remove zip file
            elif filename.endswith('.tar.gz'):
                with tarfile.open(file_path, 'r:gz') as tar_ref:
                    tar_ref.extractall(dataset_dir)
                file_path.unlink()  # Remove tar file
            
            return True
        except Exception as e:
            logger.error(f"Direct download failed for {name}: {e}")
            return False
    
    def _download_api(self, name: str, config: Dict, dataset_dir: Path) -> bool:
        """Download from API."""
        try:
            if name == 'openfoodfacts':
                return self._download_openfoodfacts(dataset_dir)
            elif name == 'usda_nutrition':
                return self._download_usda(config, dataset_dir)
            else:
                return self._download_direct(name, config, dataset_dir)
        except Exception as e:
            logger.error(f"API download failed for {name}: {e}")
            return False
    
    def _download_openfoodfacts(self, dataset_dir: Path) -> bool:
        """Download Open Food Facts data."""
        try:
            # Download sample data via API
            url = "https://world.openfoodfacts.org/cgi/search.pl"
            params = {
                'search_terms': '',
                'search_simple': 1,
                'action': 'process',
                'json': 1,
                'page_size': 1000,  # Limit for demo
                'fields': 'code,product_name,brands,categories,nutrition_grades,nutriments,image_url'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Save as JSON
            with open(dataset_dir / 'openfoodfacts_sample.json', 'w') as f:
                json.dump(data, f, indent=2)
            
            # Convert to CSV for easier processing
            if 'products' in data:
                df = pd.json_normalize(data['products'])
                df.to_csv(dataset_dir / 'openfoodfacts_sample.csv', index=False)
            
            return True
        except Exception as e:
            logger.error(f"Open Food Facts download failed: {e}")
            return False
    
    def _download_usda(self, config: Dict, dataset_dir: Path) -> bool:
        """Download USDA FoodData Central."""
        return self._download_direct('usda_nutrition', config, dataset_dir)
    
    def _parse_size_gb(self, size_str: str) -> float:
        """Parse size string to GB float."""
        size_str = size_str.lower()
        if 'gb' in size_str:
            return float(size_str.replace('gb', '').strip())
        elif 'mb' in size_str:
            return float(size_str.replace('mb', '').strip()) / 1024
        else:
            return 1.0  # Default 1GB
    
    def _create_metadata(self, downloaded: List[str]) -> None:
        """Create metadata file for downloaded datasets."""
        metadata = {
            'downloaded_at': datetime.now().isoformat(),
            'datasets': []
        }
        
        for name in downloaded:
            if name in self.datasets:
                config = self.datasets[name]
                dataset_dir = self.data_dir / name
                
                # Count files
                file_count = len(list(dataset_dir.rglob('*'))) if dataset_dir.exists() else 0
                
                metadata['datasets'].append({
                    'name': name,
                    'description': config['description'],
                    'size': config['size'],
                    'file_count': file_count,
                    'path': str(dataset_dir.relative_to(self.data_dir))
                })
        
        with open(self.data_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Created metadata file with {len(downloaded)} datasets")

def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Download CalAi datasets')
    parser.add_argument('--data-dir', default='./datasets', help='Data directory')
    parser.add_argument('--max-size', type=float, default=10.0, help='Max size in GB')
    parser.add_argument('--dataset', help='Download specific dataset')
    parser.add_argument('--list', action='store_true', help='List available datasets')
    
    args = parser.parse_args()
    
    downloader = DatasetDownloader(args.data_dir)
    
    if args.list:
        print("Available datasets:")
        for name, config in downloader.datasets.items():
            print(f"  {name}: {config['description']} ({config['size']})")
        return
    
    if args.dataset:
        success = downloader.download_dataset(args.dataset)
        if success:
            print(f"Successfully downloaded {args.dataset}")
        else:
            print(f"Failed to download {args.dataset}")
    else:
        downloader.download_all(args.max_size)

if __name__ == '__main__':
    main()
